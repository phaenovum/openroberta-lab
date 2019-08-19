package de.fhg.iais.roberta.util.test.mbed;

import org.junit.Assert;

import de.fhg.iais.roberta.components.Configuration;
import de.fhg.iais.roberta.components.MicrobitConfiguration;
import de.fhg.iais.roberta.factory.MicrobitFactory;
import de.fhg.iais.roberta.transformer.Jaxb2ProgramAst;
import de.fhg.iais.roberta.util.PluginProperties;
import de.fhg.iais.roberta.util.Util1;
import de.fhg.iais.roberta.visitor.codegen.MicrobitPythonVisitor;

/**
 * This class is used to store helper methods for operation with JAXB objects and generation code from them.
 */
public class HelperMicrobitForXmlTest extends de.fhg.iais.roberta.util.test.AbstractHelperForXmlTest {

    public HelperMicrobitForXmlTest() {
        super(
            new MicrobitFactory(new PluginProperties("microbit", "", "", Util1.loadProperties("classpath:/microbit.properties"))),
            new MicrobitConfiguration.Builder().build());
    }

    /**
     * Generate python code as string from a given program . Prepend and append wrappings.
     *
     * @param pathToProgramXml path to a XML file, usable for {@link Class#getResourceAsStream(String)}
     * @return the code as string
     * @throws Exception
     */
    public String generatePython(String pathToProgramXml, Configuration brickConfiguration) throws Exception {
        Jaxb2ProgramAst<Void> transformer = generateTransformer(pathToProgramXml);
        String code = MicrobitPythonVisitor.generate(brickConfiguration, transformer.getTree(), true);
        // System.out.println(code); // only needed for EXTREME debugging
        return code;
    }

    public String generatePython(String pathToProgramXML) throws Exception {
        Jaxb2ProgramAst<Void> transformer = generateTransformer(pathToProgramXML);
        return MicrobitPythonVisitor.generate(transformer.getTree(), true);
    }

    public void compareExistingAndGeneratedSource(String sourceCodeFilename, String xmlFilename) throws Exception {
        Assert.assertEquals(Util1.readResourceContent(sourceCodeFilename).replaceAll("\\s+", ""), generatePython(xmlFilename).replaceAll("\\s+", ""));
    }
}
