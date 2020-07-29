package de.fhg.iais.roberta.util;

import com.google.common.base.Charsets;

import org.apache.commons.io.output.ByteArrayOutputStream;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.xml.transform.Source;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerConfigurationException;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;

import de.fhg.iais.roberta.util.dbc.DbcException;

public final class XsltTransformer {
    private static final Pattern NAMESPACE_CHECK = Pattern.compile("<block_set", Pattern.LITERAL);
    private final Transformer mappingTransformer;
    private final Transformer expansionTransformer;

    private XsltTransformer() {
        try (InputStream mappingStream = Util.getInputStream(false, "classpath:/mapping.xslt");
            InputStream expansionStream = Util.getInputStream(false, "classpath:/expansion.xslt")) {

            TransformerFactory factory = TransformerFactory.newInstance();
            Source mappingSource = new StreamSource(mappingStream);
            this.mappingTransformer = factory.newTransformer(mappingSource);
            Source expansionSource = new StreamSource(expansionStream);
            this.expansionTransformer = factory.newTransformer(expansionSource);
        } catch ( TransformerConfigurationException | IOException e ) {
            throw new DbcException("Could not create XSLT transformer!", e);
        }
    }

    public static XsltTransformer getInstance() {
        return InstanceHolder.instance;
    }

    public Pair<String, String> transform(String programXml, String configXml) {
        // Sometimes the namespace is missing, it needs to be appended, otherwise the XSLT does not detect anything
        if ( !programXml.contains("xmlns=\"http://de.fhg.iais.roberta.blockly\"") ) {
            programXml = NAMESPACE_CHECK.matcher(programXml).replaceAll(Matcher.quoteReplacement("<block_set xmlns=\"http://de.fhg.iais.roberta.blockly\" "));
        }
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Source mappingInput = new StreamSource(new ByteArrayInputStream(programXml.getBytes(Charsets.UTF_8)));
            this.mappingTransformer.transform(mappingInput, new StreamResult(output));
            String mappingOutput = output.toString(Charsets.UTF_8);

            output.reset();
            Source expansionInput = new StreamSource(new ByteArrayInputStream(mappingOutput.getBytes(Charsets.UTF_8)));
            this.expansionTransformer.transform(expansionInput, new StreamResult(output));
            String expansionOutput = output.toString(Charsets.UTF_8);

            // TODO check if it needs to be applied to the configuration as well

            return Pair.of(expansionOutput, configXml);
        } catch ( TransformerException | IOException e ) {
            throw new DbcException("Could not transform program or configuration!", e);
        }
    }

    private static final class InstanceHolder {
        static final XsltTransformer instance = new XsltTransformer();
    }
}
