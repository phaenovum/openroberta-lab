package de.fhg.iais.roberta.syntax.action.nao;

import org.junit.Test;

import de.fhg.iais.roberta.syntax.NaoAstTest;
import de.fhg.iais.roberta.util.test.UnitTestHelper;

public class TakePictureTopTest extends NaoAstTest {

    @Test
    public void make_ByDefault_ReturnInstanceOfTakePictureClass() throws Exception {
        String expectedResult = "BlockAST [project=[[Location [x=138, y=138], " + "MainTask [], " + "TakePicture [TOP, StringConst [RobertaPicture]]]]]";

        UnitTestHelper.checkProgramAstEquality(testFactory, expectedResult, "/action/takePicture_top.xml");

    }

    /*
    @Test
    public void astToBlock_XMLtoJAXBtoASTtoXML_ReturnsSameXML() throws Exception {
    
        UnitTestHelper.checkProgramReverseTransformation(testFactory, "/action/takePicture_top.xml");
    }*/
}