package de.fhg.iais.roberta.codegen;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.apache.commons.lang3.SystemUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import de.fhg.iais.roberta.blockly.generated.BlockSet;
import de.fhg.iais.roberta.components.Configuration;
import de.fhg.iais.roberta.factory.IRobotFactory;
import de.fhg.iais.roberta.inter.mode.action.ILanguage;
import de.fhg.iais.roberta.transformer.BlocklyProgramAndConfigTransformer;
import de.fhg.iais.roberta.transformer.nxt.Jaxb2NxtConfigurationTransformer;
import de.fhg.iais.roberta.util.Key;
import de.fhg.iais.roberta.util.PluginProperties;
import de.fhg.iais.roberta.util.dbc.VisitorException;
import de.fhg.iais.roberta.util.jaxb.JaxbHelper;
import de.fhg.iais.roberta.visitor.codegen.NxtNxcVisitor;

public class NxtCompilerWorkflow extends AbstractCompilerWorkflow {

    private static final Logger LOG = LoggerFactory.getLogger(NxtCompilerWorkflow.class);

    public NxtCompilerWorkflow(PluginProperties pluginProperties) {
        super(pluginProperties);
    }

    @Override
    public void generateSourceCode(String token, String programName, BlocklyProgramAndConfigTransformer data, ILanguage language) //
    {
        if ( data.getErrorMessage() != null ) {
            this.workflowResult = Key.COMPILERWORKFLOW_ERROR_PROGRAM_TRANSFORM_FAILED;
            return;
        }
        try {
            this.generatedSourceCode = NxtNxcVisitor.generate(data.getRobotConfiguration(), data.getProgramTransformer().getTree(), true);
            LOG.info("nxt code generated");
        } catch ( VisitorException v ) {
            LOG.error("NXT code generation failed due to error on the list block", v);
            this.workflowResult = Key.LIST_CREATE_WITH_ERROR;
        } catch ( Exception e ) {
            LOG.error("nxt code generation failed", e);
            this.workflowResult = Key.COMPILERWORKFLOW_ERROR_PROGRAM_GENERATION_FAILED;
        }
    }

    @Override
    public void compileSourceCode(String token, String programName, ILanguage language, Object flagProvider) {
        storeGeneratedProgram(token, programName, ".nxc");

        if ( this.workflowResult == Key.COMPILERWORKFLOW_SUCCESS ) {
            this.workflowResult = runBuild(token, programName, "generated.main");
            if ( this.workflowResult == Key.COMPILERWORKFLOW_SUCCESS ) {
                LOG.info("compile nxt program {} successful", programName);
            } else {
                LOG.error("compile nxt program {} failed with {}", programName, this.workflowResult);
            }
        }
    }

    @Override
    public Configuration generateConfiguration(IRobotFactory factory, String blocklyXml) throws Exception {
        BlockSet project = JaxbHelper.xml2BlockSet(blocklyXml);
        Jaxb2NxtConfigurationTransformer transformer = new Jaxb2NxtConfigurationTransformer(factory);
        return transformer.transform(project);
    }

    @Override
    public String getCompiledCode() {
        return null;
    }

    /**
     * 1. Make target folder (if not exists).<br>
     * 2. Clean target folder (everything inside).<br>
     * 3. Compile .java files to .class.<br>
     * 4. Make jar from class files and add META-INF entries.<br>
     *
     * @param token
     * @param mainFile
     * @param mainPackage
     */
    Key runBuild(String token, String mainFile, String mainPackage) {
        final String compilerResourcesDir = this.pluginProperties.getCompilerResourceDir();
        final String tempDir = this.pluginProperties.getTempDir();

        Path path = Paths.get(compilerResourcesDir);
        Path base = Paths.get("");

        String nbcCompilerFileName = compilerResourcesDir + "/windows/nbc.exe";
        if ( SystemUtils.IS_OS_LINUX ) {
            nbcCompilerFileName = "nbc";
        } else if ( SystemUtils.IS_OS_MAC ) {
            nbcCompilerFileName = compilerResourcesDir + "/osx/nbc";
        }

        String[] executableWithParameters =
            new String[] {
                nbcCompilerFileName,
                "-q",
                "-sm-",
                tempDir + token + "/" + mainFile + "/source/" + mainFile + ".nxc",
                "-O=" + tempDir + token + "/" + mainFile + "/target/" + mainFile + ".rxe",
                "-I=" + base.resolve(path).toAbsolutePath().normalize().toString()
            };
        return runCrossCompiler(executableWithParameters) ? Key.COMPILERWORKFLOW_SUCCESS : Key.COMPILERWORKFLOW_ERROR_PROGRAM_COMPILE_FAILED;
    }
}
