package de.fhg.iais.roberta.ast.syntax.expr;

import org.junit.Test;

import de.fhg.iais.roberta.syntax.codegen.arduino.arduino.ArduinoAstTest;
import de.fhg.iais.roberta.util.test.UnitTestHelper;
import de.fhg.iais.roberta.worker.codegen.ArduinoCxxGeneratorWorker;

public class MathSingleTest extends ArduinoAstTest {

    @Test
    public void Test() throws Exception {
        final String a = "sqrt(0)absD(0)-(0)log(0)log10(0)exp(0)pow(10.0,0)";
        UnitTestHelper.checkWorkers(testFactory, a, "/syntax/math/math_single.xml", new ArduinoCxxGeneratorWorker());
    }

    @Test
    public void Test2() throws Exception {
        final String a = "___item=sqrt(0);";
        UnitTestHelper.checkWorkers(testFactory, a, "/syntax/math/math_single2.xml", new ArduinoCxxGeneratorWorker());
    }
}
