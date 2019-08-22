package de.fhg.iais.roberta.util.test.raspberrypi;

import org.junit.Assert;

import de.fhg.iais.roberta.components.raspberrypi.RaspberryPiConfiguration;
import de.fhg.iais.roberta.factory.RaspberryPiFactory;
import de.fhg.iais.roberta.mode.action.Language;
import de.fhg.iais.roberta.transformer.Jaxb2ProgramAst;
import de.fhg.iais.roberta.util.PluginProperties;
import de.fhg.iais.roberta.util.Util1;
import de.fhg.iais.roberta.util.test.AbstractHelperForXmlTest;
import de.fhg.iais.roberta.visitor.codegen.RaspberryPiPythonVisitor;

public class HelperRaspberryPiForXmlTest extends AbstractHelperForXmlTest {

    public HelperRaspberryPiForXmlTest() {
        super(
            new RaspberryPiFactory(new PluginProperties("raspberrypi", "", "", Util1.loadProperties("classpath:/raspberrypi.properties"))),
            new RaspberryPiConfiguration.Builder().build());
    }

    /**
     * Generate java code as string from a given program fragment. Do not prepend and append wrappings.
     *
     * @param pathToProgramXml path to a XML file, usable for {@link Class#getResourceAsStream(String)}
     * @return the code fragment as string
     * @throws Exception
     */
    private String generateStringWithoutWrapping(String pathToProgramXml) throws Exception {
        Jaxb2ProgramAst<Void> transformer = generateTransformer(pathToProgramXml);
        String javaCode =
            RaspberryPiPythonVisitor
                .generate(
                    (RaspberryPiConfiguration) getRobotConfiguration(),
                    transformer.getTree(),
                    false,
                    Language.ENGLISH,
                    getRobotFactory().getHelperMethodGenerator());
        return javaCode;
    }

    /**
     * Assert that Java code generated from Blockly XML program is correct.<br>
     * All white space are ignored!
     *
     * @param correctJavaCode correct java code
     * @param fileName of the program we want to generate java code
     * @throws Exception
     */
    public void assertCodeIsOk(String correctJavaCode, String fileName) throws Exception {
        Assert.assertEquals(correctJavaCode.replaceAll("\\s+", ""), generateStringWithoutWrapping(fileName).replaceAll("\\s+", ""));
    }

    /**
     * this.robotConfiguration Generate python code as string from a given program . Prepend and append wrappings.
     *
     * @param pathToProgramXml path to a XML file, usable for {@link Class#getResourceAsStream(String)}
     * @return the code as string
     * @throws Exception
     */
    public String generatePython(String pathToProgramXml, RaspberryPiConfiguration brickConfiguration) throws Exception {
        Jaxb2ProgramAst<Void> transformer = generateTransformer(pathToProgramXml);
        String code =
            RaspberryPiPythonVisitor.generate(brickConfiguration, transformer.getTree(), true, Language.ENGLISH, getRobotFactory().getHelperMethodGenerator());
        // System.out.println(code); // only needed for EXTREME debugging
        return code;
    }
}
