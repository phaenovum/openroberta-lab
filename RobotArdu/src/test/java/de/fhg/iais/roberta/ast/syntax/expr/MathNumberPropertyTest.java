package de.fhg.iais.roberta.ast.syntax.expr;

import org.junit.Test;

import de.fhg.iais.roberta.util.test.ardu.HelperBotNrollForXmlTest;

public class MathNumberPropertyTest {
    private final HelperBotNrollForXmlTest h = new HelperBotNrollForXmlTest();

    @Test
    public void Test() throws Exception {
        final String a = "(fmod(0,2)==0)(fmod(0,2)!=0)isPrimeD(0)isWholeD(0)(0>0)(0<0)(fmod(0,0)==0)";

        this.h.assertCodeIsOk(a, "/syntax/math/math_number_property.xml", false);
    }

    @Test
    public void Test1() throws Exception {
        final String a = "___item=(fmod(0,2)==0);";

        this.h.assertCodeIsOk(a, "/syntax/math/math_number_property1.xml", false);
    }

}
