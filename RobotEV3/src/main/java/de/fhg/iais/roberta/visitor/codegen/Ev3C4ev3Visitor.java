package de.fhg.iais.roberta.visitor.codegen;

import com.google.common.collect.Lists;
import de.fhg.iais.roberta.components.Configuration;
import de.fhg.iais.roberta.components.ConfigurationComponent;
import de.fhg.iais.roberta.components.UsedActor;
import de.fhg.iais.roberta.inter.mode.action.*;
import de.fhg.iais.roberta.mode.action.DriveDirection;
import de.fhg.iais.roberta.mode.action.MotorMoveMode;
import de.fhg.iais.roberta.mode.action.MotorStopMode;
import de.fhg.iais.roberta.mode.action.TurnDirection;
import de.fhg.iais.roberta.mode.general.IndexLocation;
import de.fhg.iais.roberta.mode.general.ListElementOperations;
import de.fhg.iais.roberta.syntax.*;
import de.fhg.iais.roberta.syntax.action.communication.*;
import de.fhg.iais.roberta.syntax.action.display.ClearDisplayAction;
import de.fhg.iais.roberta.syntax.action.display.ShowTextAction;
import de.fhg.iais.roberta.syntax.action.ev3.ShowPictureAction;
import de.fhg.iais.roberta.syntax.action.light.LightAction;
import de.fhg.iais.roberta.syntax.action.light.LightStatusAction;
import de.fhg.iais.roberta.syntax.action.motor.MotorGetPowerAction;
import de.fhg.iais.roberta.syntax.action.motor.MotorOnAction;
import de.fhg.iais.roberta.syntax.action.motor.MotorSetPowerAction;
import de.fhg.iais.roberta.syntax.action.motor.MotorStopAction;
import de.fhg.iais.roberta.syntax.action.motor.differential.CurveAction;
import de.fhg.iais.roberta.syntax.action.motor.differential.DriveAction;
import de.fhg.iais.roberta.syntax.action.motor.differential.MotorDriveStopAction;
import de.fhg.iais.roberta.syntax.action.motor.differential.TurnAction;
import de.fhg.iais.roberta.syntax.action.sound.PlayFileAction;
import de.fhg.iais.roberta.syntax.action.sound.PlayNoteAction;
import de.fhg.iais.roberta.syntax.action.sound.ToneAction;
import de.fhg.iais.roberta.syntax.action.sound.VolumeAction;
import de.fhg.iais.roberta.syntax.action.speech.SayTextAction;
import de.fhg.iais.roberta.syntax.action.speech.SetLanguageAction;
import de.fhg.iais.roberta.syntax.lang.blocksequence.MainTask;
import de.fhg.iais.roberta.syntax.lang.expr.*;
import de.fhg.iais.roberta.syntax.lang.functions.*;
import de.fhg.iais.roberta.syntax.lang.stmt.DebugAction;
import de.fhg.iais.roberta.syntax.lang.stmt.RepeatStmt;
import de.fhg.iais.roberta.syntax.lang.stmt.WaitStmt;
import de.fhg.iais.roberta.syntax.lang.stmt.WaitTimeStmt;
import de.fhg.iais.roberta.syntax.sensor.generic.*;
import de.fhg.iais.roberta.typecheck.BlocklyType;
import de.fhg.iais.roberta.util.dbc.Assert;
import de.fhg.iais.roberta.util.dbc.DbcException;
import de.fhg.iais.roberta.visitor.codegen.utilities.TTSLanguageMapper;
import de.fhg.iais.roberta.visitor.collect.Ev3UsedHardwareCollectorVisitor;
import de.fhg.iais.roberta.visitor.hardware.IEv3Visitor;
import de.fhg.iais.roberta.visitor.lang.codegen.prog.AbstractCppVisitor;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class Ev3C4ev3Visitor extends AbstractCppVisitor implements IEv3Visitor<Void> {

    private static final List<String> ev3SensorPorts = Lists.newArrayList("1", "2", "3", "4");

    private static final String PREFIX_OUTPUT_PORT = "OUT_";
    private static final String PREFIX_IN_PORT = "IN_";

    private final ILanguage language;
    private final boolean isSayTextUsed;

    private final Configuration brickConfiguration;

    private final Set<UsedActor> usedActors;

    /**
     * initialize the EV3 c4ev3 code generator visitor.
     *
     * @param programPhrases
     * @param indentation to start with. Will be incr/decr depending on block structure
     */
    private Ev3C4ev3Visitor(Configuration brickConfiguration, ArrayList<ArrayList<Phrase<Void>>> programPhrases, int indentation, ILanguage language) {
        super(programPhrases, indentation);
        Ev3UsedHardwareCollectorVisitor checkVisitor = new Ev3UsedHardwareCollectorVisitor(programPhrases, brickConfiguration);
        this.brickConfiguration = brickConfiguration;
        this.language = language;
        this.usedActors = checkVisitor.getUsedActors();
        this.loopsLabels = checkVisitor.getloopsLabelContainer();
        this.isSayTextUsed = checkVisitor.isSayTextUsed();
    }

    private static String getPrefixedOutputPort(String port) {
        return PREFIX_OUTPUT_PORT + port;
    }

    private static String getPrefixedInputPort(String port) {
        return PREFIX_IN_PORT + port;
    }

    /**
     * factory method to generate EV3 c4ev3 code from an AST.<br>
     *
     * @param programName
     * @param brickConfiguration
     * @param phrasesSet
     * @param withWrapping
     * @param language
     * @return
     */
    public static String generate(
        String programName, Configuration brickConfiguration, ArrayList<ArrayList<Phrase<Void>>> phrasesSet, boolean withWrapping, ILanguage language) {
        Assert.notNull(programName);
        Assert.notNull(brickConfiguration);

        Ev3C4ev3Visitor astVisitor = new Ev3C4ev3Visitor(brickConfiguration, phrasesSet, 0, language);
        astVisitor.generateCode(withWrapping);
        return astVisitor.sb.toString();
    }

    @Override
    protected void generateProgramPrefix(boolean withWrapping) {
        generateConstants();
        generateImports();
    }

    private void generateConstants() {
        this.sb.append("#define WHEEL_DIAMETER " + brickConfiguration.getWheelDiameterCM() + "\n");
        this.sb.append("#define TRACK_WIDTH " + brickConfiguration.getTrackWidthCM() + "\n");
        nlIndent();
    }

    private void generateImports() {
        this.sb.append("#include <ev3.h>\n");
        this.sb.append("#include <math.h>\n");
        this.sb.append("#include <list>\n");
        this.sb.append("#include \"NEPODefs.h\"");
    }

    @Override
    public Void visitMainTask(MainTask<Void> mainTask) {
        mainTask.getVariables().visit(this);
        nlIndent();
        generateUserDefinedMethods();
        nlIndent();
        this.sb.append("int main () {");
        incrIndentation();
        nlIndent();
        this.sb.append("NEPOInitEV3();");
        nlIndent();
        generateSensorInitialization();
        nlIndent();
        generateTTSInitialization();
        nlIndent();
        return null;
    }

    @Override
    public Void visitVarDeclaration(VarDeclaration<Void> var) {
        this.sb.append(getLanguageVarTypeFromBlocklyType(var.getTypeVar())).append(" ");
        this.sb.append("___" + var.getName());
        if ( !var.getValue().getKind().hasName("EMPTY_EXPR") ) {
            this.sb.append(" = ");
            if ( var.getValue().getKind().hasName("EXPR_LIST") ) {
                ExprList<Void> list = (ExprList<Void>) var.getValue();
                if ( list.get().size() == 2 ) {
                    list.get().get(1).visit(this);
                } else {
                    list.get().get(0).visit(this);
                }
            } else {
                var.getValue().visit(this);
            }
        }
        return null;
    }

    private void generateSensorInitialization() {
        this.sb.append("setAllSensorMode(").append(getDefaultSensorModesString()).append(");");
    }

    private void generateTTSInitialization () {
        if (isSayTextUsed) {
            this.sb.append("SetLanguage(\"" + TTSLanguageMapper.getLanguageString(language) + "\");");
        }
    }

    private String getDefaultSensorModesString() {
        return ev3SensorPorts.stream()
            .map(brickConfiguration::optConfigurationComponent)
            .map(configuration -> configuration == null ? null : "DEFAULT_MODE_" + configuration.getComponentType())
            .map(componentType -> componentType == null ? "NO_SEN" : componentType)
            .collect(Collectors.joining(", "));
    }

    @Override
    protected void generateProgramSuffix(boolean withWrapping) {
        nlIndent();
        nlIndent();
        this.sb.append("NEPOFreeEV3();");
        nlIndent();
        this.sb.append("return 0;");
        decrIndentation();
        nlIndent();
        this.sb.append("}");
        nlIndent();
    }


    @Override
    protected String getLanguageVarTypeFromBlocklyType(BlocklyType type) {
        switch ( type ) {
            case STRING:
                return "std::string";
            case COLOR:
                return "Color";
            case ARRAY_STRING:
                return "std::list<std::string>";
            case ARRAY_COLOUR:
                return "std::list<Color>";
            case CONNECTION:
                return "BluetoothConnectionHandle";
            default:
                return super.getLanguageVarTypeFromBlocklyType(type);
        }
    }

    @Override
    public Void visitMathConst(MathConst<Void> mathConst) {
        String constantName = getCMathConstantName(mathConst.getMathConst());
        this.sb.append(constantName);
        return null;
    }

    private String getCMathConstantName(MathConst.Const constant) {
        switch ( constant ) {
            case PI:
                return "M_PI";
            case E:
                return "M_E";
            case GOLDEN_RATIO:
                return "GOLDEN_RATIO";
            case SQRT2:
                return "M_SQRT2";
            case SQRT1_2:
                return "M_SQRT1_2";
            // IEEE 754 floating point representation
            case INFINITY:
                return "HUGE_VAL";
            default:
                throw new DbcException("unknown constant");
        }
    }

    @Override public Void visitMathSingleFunct(MathSingleFunct<Void> mathSingleFunct) {
        if ( isSingleMathFunctAbs(mathSingleFunct.getFunctName())) {
            this.generateSingleMathFunctAbs(mathSingleFunct);
            return null;
        }
        return super.visitMathSingleFunct(mathSingleFunct);
    }

    private boolean isSingleMathFunctAbs(FunctionNames functionName) {
        return functionName.equals(FunctionNames.ABS);
    }

    private void generateSingleMathFunctAbs (MathSingleFunct<Void> mathSingleFunct) {
        this.sb.append("abs(");
        mathSingleFunct.getParam().get(0).visit(this);
        this.sb.append(")");
    }

    @Override
    public Void visitMathPowerFunct(MathPowerFunct<Void> mathPowerFunct) {
        this.sb.append("pow(");
        super.visitMathPowerFunct(mathPowerFunct);
        return null;
    }

    @Override
    public Void visitColorConst(ColorConst<Void> colorConst) {
        String colorConstant = getColorConstantByHex(colorConst.getHexValueAsString());
        this.sb.append(colorConstant);
        return null;
    }

    private String getColorConstantByHex(String hex) {
        switch ( hex.toUpperCase() ) {
            case "#000000":
                return "Black";
            case "#0057A6":
                return "Blue";
            case "#00642E":
                return "Green";
            case "#F7D117":
                return "Yellow";
            case "#B30006":
                return "Red";
            case "#FFFFFF":
                return "White";
            case "#532115":
                return "Brown";
            case "#EE82EE":
                return "Violet";
            case "#800080":
                return "Purple";
            case "#00FF00":
                return "Lime";
            case "#FFA500":
                return "Orange";
            case "#FF00FF":
                return "Magenta"; // TODO: is this defined?
            case "#DC143C":
                return "Crismon";
            case "#585858":
                return "Transparent";
            default:
                throw new DbcException("Invalid color constant: " + hex);
        }
    }

//    @Override
//    public Void visitBinary(Binary<Void> binary) {
//        // TODO: Clean
//        Binary.Op op = binary.getOp();
//        if ( op == Binary.Op.ADD || op == Binary.Op.MINUS || op == Binary.Op.DIVIDE || op == Binary.Op.MULTIPLY ) {
//            this.sb.append("(");
//        }
//        if (op == Binary.Op.MOD) {
//            this.sb.append("fmod(");
//        }
//        generateSubExpr(this.sb, false, binary.getLeft(), binary);
//        String sym = getBinaryOperatorSymbol(op);
//        this.sb.append(" " + sym + " ");
//        switch ( op ) {
//            case TEXT_APPEND:
//                if ( binary.getRight().getVarType().toString().contains("NUMBER") ) {
//                    this.sb.append("ToString(");
//                    generateSubExpr(this.sb, false, binary.getRight(), binary);
//                    this.sb.append(")");
//                } else {
//                    generateSubExpr(this.sb, false, binary.getRight(), binary);
//                }
//                break;
//            case DIVIDE:
//                this.sb.append("((");
//                generateSubExpr(this.sb, parenthesesCheck(binary), binary.getRight(), binary);
//                this.sb.append(")*1.0)");
//                break;
//
//            default:
//                generateSubExpr(this.sb, parenthesesCheck(binary), binary.getRight(), binary);
//        }
//        if ( op == Binary.Op.ADD || op == Binary.Op.MINUS || op == Binary.Op.DIVIDE || op == Binary.Op.MULTIPLY || op == Binary.Op.MOD) {
//            this.sb.append(")");
//        }
//        return null;
//    }

    // copied from AbstractCommonArduinoCppVisitor
    @Override
    public Void visitBinary(Binary<Void> binary) {
        Binary.Op op = binary.getOp();
        if ( op == Binary.Op.MOD ) {
            appendFloatModulo(binary);
            return null;
        }
        generateSubExpr(this.sb, false, binary.getLeft(), binary);
        String sym = getBinaryOperatorSymbol(op);
        this.sb.append(whitespace() + sym + whitespace());
        if ( op == Binary.Op.TEXT_APPEND ) {
            convertToString(binary);
            return null;
        } else if ( op == Binary.Op.DIVIDE ) {
            appendCastToFloat(binary);
            return null;
        } else {
            generateSubExpr(this.sb, parenthesesCheck(binary), binary.getRight(), binary);
        }
        return null;
    }

    private void appendFloatModulo(Binary<Void> binary) {
        this.sb.append("fmod(");
        generateSubExpr(this.sb, false, binary.getLeft(), binary);
        this.sb.append(", ");
        generateSubExpr(this.sb, parenthesesCheck(binary), binary.getRight(), binary);
        this.sb.append(")");
    }

    private void appendCastToFloat(Binary<Void> binary) {
        this.sb.append("((double) ");
        generateSubExpr(this.sb, parenthesesCheck(binary), binary.getRight(), binary);
        this.sb.append(")");
    }

    private void convertToString(Binary<Void> binary) {
        switch ( binary.getRight().getVarType() ) {
            case BOOLEAN:
            case NUMBER:
            case NUMBER_INT:
            case COLOR:
                this.sb.append("ToString(");
                generateSubExpr(this.sb, false, binary.getRight(), binary);
                this.sb.append(")");
                break;
            default:
                generateSubExpr(this.sb, false, binary.getRight(), binary);
                break;
        }
    }
    // end copied from AbstractCommonArduinoCppVisitor


    @Override
    public Void visitRepeatStmt(RepeatStmt<Void> repeatStmt) {
        Expr<Void> condition = repeatStmt.getExpr();
        boolean isWaitStmt = repeatStmt.getMode() == RepeatStmt.Mode.WAIT;
        if ( !isWaitStmt ) {
            increaseLoopCounter();
        }
        switch ( repeatStmt.getMode() ) {
            case UNTIL:
            case WHILE:
            case FOREVER:
                generateCodeFromStmtCondition("while", condition);
                break;
            case TIMES:
            case FOR:
                generateCodeFromStmtConditionFor(condition);
                break;
            case WAIT:
                generateCodeFromStmtCondition("if", condition);
                break;
            case FOR_EACH:
                generateForEachPrefix(condition);
        }
        incrIndentation();
        repeatStmt.getList().visit(this);
        if ( !isWaitStmt ) {
            addContinueLabelToLoop();
        } else {
            appendBreakStmt();
        }
        decrIndentation();
        nlIndent();
        this.sb.append("}");
        addBreakLabelToLoop(isWaitStmt);
        return null;
    }

    private  void generateCodeFromStmtConditionFor(Expr<Void> expr) {
        final ExprList<Void> expressions = (ExprList<Void>) expr;
        Expr<Void> counterName = expressions.get().get(0);
        Expr<Void> counterInitialValue = expressions.get().get(1);
        Expr<Void> counterTargetValue = expressions.get().get(2);
        Expr<Void> counterStep = expressions.get().get(3);
        this.sb.append("for (" + "float ");
        counterName.visit(this);
        this.sb.append(" = ");
        counterInitialValue.visit(this);
        this.sb.append("; ");
        counterName.visit(this);
        this.sb.append(" < ");
        counterTargetValue.visit(this);
        this.sb.append("; ");
        counterName.visit(this);
        this.sb.append(" += ");
        counterStep.visit(this);
        this.sb.append(") {");
    }

    private void generateForEachPrefix(Expr<Void> expression) {
        ((VarDeclaration<Void>) ((Binary<Void>) expression).getLeft()).visit(this);
        this.sb.append(";");
        nlIndent();
        this.sb.append("for(int i = 0; i < ArrayLen(");
        this.sb.append(((Var<Void>) ((Binary<Void>) expression).getRight()).getValue());
        this.sb.append("); ++i) {");
        incrIndentation();
        nlIndent();
        this.sb.append(((VarDeclaration<Void>) ((Binary<Void>) expression).getLeft()).getName());
        this.sb.append(" = _getListElementByIndex(");
        this.sb.append(((Var<Void>) ((Binary<Void>) expression).getRight()).getValue());
        this.sb.append(", i);");
        decrIndentation();
    }

    @Override
    public Void visitDebugAction(DebugAction<Void> debugAction) {
        this.sb.append("printf(\"%s\\\n\", ToString(");
        debugAction.getValue().visit(this);
        this.sb.append(").c_str());");
        return null;
    }

    @Override
    public Void visitWaitStmt(WaitStmt<Void> waitStmt) {
        this.sb.append("while ( true ) {");
        incrIndentation();
        visitStmtList(waitStmt.getStatements());
        nlIndent();
        this.sb.append("Wait(15);");
        decrIndentation();
        nlIndent();
        this.sb.append("}");
        return null;
    }

    @Override
    public Void visitWaitTimeStmt(WaitTimeStmt<Void> waitTimeStmt) {
        this.sb.append("Wait(");
        waitTimeStmt.getTime().visit(this);
        this.sb.append(");");
        return null;
    }


    // copied from Arduino
    @Override
    public Void visitIndexOfFunct(IndexOfFunct<Void> indexOfFunct) {
        if ( indexOfFunct.getParam().get(0).toString().contains("ListCreate ") ) {
            this.sb.append("null");
            return null;
        }
        String methodName = indexOfFunct.getLocation() == IndexLocation.LAST ? "_getLastOccuranceOfElement(" : "_getFirstOccuranceOfElement(";
        this.sb.append(methodName);
        indexOfFunct.getParam().get(0).visit(this);
        this.sb.append(", ");
        if ( indexOfFunct.getParam().get(1).getClass().equals(StringConst.class) ) {
            this.sb.append("String(");
            indexOfFunct.getParam().get(1).visit(this);
            this.sb.append(")");
        } else {
            indexOfFunct.getParam().get(1).visit(this);
        }
        this.sb.append(")");
        return null;
    }

    @Override
    public Void visitLengthOfIsEmptyFunct(LengthOfIsEmptyFunct<Void> lengthOfIsEmptyFunct) {
        if ( lengthOfIsEmptyFunct.getParam().get(0).toString().contains("ListCreate ") ) {
            this.sb.append("NULL");
            return null;
        }
        if ( lengthOfIsEmptyFunct.getFunctName() == FunctionNames.LIST_IS_EMPTY ) {
            this.sb.append("(");
            lengthOfIsEmptyFunct.getParam().get(0).visit(this);
            this.sb.append(".size()");
            this.sb.append(" == 0)");
        } else {
            this.sb.append("((int) ");
            lengthOfIsEmptyFunct.getParam().get(0).visit(this);
            this.sb.append(".size())");
        }
        return null;
    }

    // end copied from Arduino

    // copied from calliope
    /*
     * TODO: I don't know why I am doing this, but it seems that without this a semicolon is lost, somehow... Artem Vinokurov 25.10.2018
     */
    @Override
    public Void visitListSetIndex(ListSetIndex<Void> listSetIndex) {
        super.visitListSetIndex(listSetIndex);
        this.sb.append(";");
        return null;
    }

    /*
     * TODO: There is something wrong with semicolon generation for calliope. Artem Vinokurov 25.10.2018
     */
    @Override
    public Void visitListGetIndex(ListGetIndex<Void> listGetIndex) {
        super.visitListGetIndex(listGetIndex);
        if ( ((ListElementOperations) listGetIndex.getElementOperation()).equals(ListElementOperations.REMOVE) ) {
            this.sb.append(";");
        }
        return null;
    }

    // end copied from calliope

    @Override
    public Void visitMathConstrainFunct(MathConstrainFunct<Void> mathConstrainFunct) {
        Expr<Void> n = mathConstrainFunct.getParam().get(0);
        Expr<Void> min = mathConstrainFunct.getParam().get(1);
        Expr<Void> max = mathConstrainFunct.getParam().get(2);
        this.sb.append("std::min(std::max((double) ");
        n.visit(this);
        this.sb.append(", (double) ");
        min.visit(this);
        this.sb.append("), (double) ");
        max.visit(this);
        this.sb.append(")");
        return null;
    }

    @Override
    public Void visitMathNumPropFunct(MathNumPropFunct<Void> mathNumPropFunct) {
        if (mathPropNeedFunctionCall(mathNumPropFunct.getFunctName())) {
            generateFunctionCallForMathProp(mathNumPropFunct);
        } else {
            generateInlineMathProp(mathNumPropFunct);
        }
        return null;
    }

    private boolean mathPropNeedFunctionCall (FunctionNames functionName) {
        try {
            getMathPropFunctionName(functionName);
            return true;
        } catch ( DbcException e ) {
            return false;
        }
    }

    private void generateFunctionCallForMathProp(MathNumPropFunct<Void> mathNumPropFunct) {
        this.sb.append(getMathPropFunctionName(mathNumPropFunct.getFunctName()) + "(");
        mathNumPropFunct.getParam().get(0).visit(this);
        this.sb.append(")");
    }

    private String getMathPropFunctionName (FunctionNames functionName) {
        switch ( functionName) {
            case PRIME:
                return "IsPrime";
            case WHOLE:
                return "IsWhole";
            default:
                throw new DbcException("Unknown function name");
        }
    }

    private void generateInlineMathProp (MathNumPropFunct<Void> mathNumPropFunct) {
        Expr<Void> n = mathNumPropFunct.getParam().get(0);
        switch ( mathNumPropFunct.getFunctName() ) {
            case EVEN:
                this.sb.append("(((int) ");
                n.visit(this);
                this.sb.append(" ) % 2 == 0)");
                break;
            case ODD:
                this.sb.append("(((int) ");
                n.visit(this);
                this.sb.append(" ) % 2 != 0)");
                break;
            case POSITIVE:
                this.sb.append("( ");
                n.visit(this);
                this.sb.append(" > 0)");
                break;
            case NEGATIVE:
                this.sb.append("( ");
                n.visit(this);
                this.sb.append(" < 0)");
                break;
            case DIVISIBLE_BY:
                this.sb.append("(((int) ");
                n.visit(this);
                this.sb.append(" ) % ((int) ");
                mathNumPropFunct.getParam().get(1).visit(this);
                this.sb.append(" ) == 0)");
                break;
            default:
                throw new DbcException("Unknown math prop");
        }
    }

    @Override
    public Void visitMathRandomFloatFunct(MathRandomFloatFunct<Void> mathRandomFloatFunct) {
        this.sb.append("rand()");
        return null;
    }

    @Override
    public Void visitMathRandomIntFunct(MathRandomIntFunct<Void> mathRandomIntFunct) {
        Expr<Void> min = mathRandomIntFunct.getParam().get(0);
        Expr<Void> max = mathRandomIntFunct.getParam().get(1);
        this.sb.append("((rand() % (");
        min.visit(this);
        this.sb.append(" - ");
        max.visit(this);
        this.sb.append(")) + ");
        min.visit(this);
        this.sb.append(")");
        return null;
    }

    @Override
    public Void visitTextJoinFunct(TextJoinFunct<Void> textJoinFunct) {
        List<Expr<Void>> texts = textJoinFunct.getParam().get();
        for (int i = 0; i < texts.size(); i++) {
            this.sb.append("ToString(");
            texts.get(i).visit(this);
            this.sb.append(")");
            if (i < texts.size() - 1) {
                this.sb.append(" + ");
            }
        }
        return null;
    }

    @Override
    public Void visitMotorOnAction(MotorOnAction<Void> motorOnAction) {
        String port = motorOnAction.getUserDefinedPort();
        MotorDuration<Void> duration = motorOnAction.getParam().getDuration();
        Expr<Void> speedExpression = motorOnAction.getParam().getSpeed();
        if ( isActorOnPort(port) ) {
            boolean isRegulated = brickConfiguration.isMotorRegulated(port);
            if ( duration != null ) {
                generateRotateMotorForDuration(port, speedExpression, motorOnAction.getDurationMode(), duration.getValue());
            } else {
                generateTurnOnMotor(port, speedExpression, isRegulated);
            }
        }
        return null;
    }

    private void generateRotateMotorForDuration(String port, Expr<Void> speedExpression, IMotorMoveMode durationMode, Expr<Void> durationExpression) {
        this.sb.append("RotateMotorForAngle(" + getPrefixedOutputPort(port) + ", ");
        visitSpeedExpression(speedExpression);
        this.sb.append(", ");
        if ( durationMode == MotorMoveMode.ROTATIONS ) {
            this.sb.append("360 * ");
        }
        durationExpression.visit(this);
        this.sb.append(");");
    }

    private void generateTurnOnMotor(String port, Expr<Void> speedExpression, boolean isRegulated) {
        String functionName = isRegulated ? "OnFwdReg" : "OnFwdEx";
        this.sb.append(functionName + "(" + getPrefixedOutputPort(port) + ", ");
        visitSpeedExpression(speedExpression);
        if(!isRegulated){
            this.sb.append(", RESET_NONE");
        }
        this.sb.append(");");
    }

    @Override
    public Void visitDriveAction(DriveAction<Void> driveAction) {
        MotorDuration<Void> duration = driveAction.getParam().getDuration();
        Expr<Void> speedExpression = driveAction.getParam().getSpeed();
        boolean reverse = isReverseGivenBrickConfigurationAndAction(driveAction.getDirection());
        if ( duration != null ) {
            generateDriveForDistance(speedExpression, duration.getValue(), reverse);
        } else {
            generateDrive(speedExpression, reverse);
        }
        return null;
    }

    private void generateDriveForDistance(Expr<Void> speedExpression, Expr<Void> distanceExpression, boolean reverse) {
        this.sb.append("RotateMotorForAngle(" + getDriveMotorPorts() + ", ");
        visitSpeedExpression(speedExpression, reverse);
        this.sb.append(", ");
        visitDistanceOfDrive(distanceExpression);
        this.sb.append(");");
    }

    private void visitDistanceOfDrive(Expr<Void> distanceExpression) {
        this.sb.append("(");
        distanceExpression.visit(this);
        this.sb.append(" * 360) / (M_PI * WHEEL_DIAMETER)");
    }

    private void generateDrive(Expr<Void> speedExpression, boolean reverse) {
        String methodName = reverse ? "OnRevSync" : "OnFwdSync";
        this.sb.append(methodName + "(" + getDriveMotorPorts() + ", ");
        visitSpeedExpression(speedExpression);
        this.sb.append(");");
    }

    @Override
    public Void visitMotorGetPowerAction(MotorGetPowerAction<Void> motorGetPowerAction) {
        String port = motorGetPowerAction.getUserDefinedPort();
        if ( isActorOnPort(port) ) {
            this.sb.append("MotorPower(OUT_" + motorGetPowerAction.getUserDefinedPort() + ")");
        }
        return null;
    }

    @Override
    public Void visitMotorSetPowerAction(MotorSetPowerAction<Void> motorSetPowerAction) {
        String port = motorSetPowerAction.getUserDefinedPort();
        this.sb.append("SetPower(" + getPrefixedOutputPort(port) + ", ");
        visitSpeedExpression(motorSetPowerAction.getPower(), isMotorReverse(port));
        this.sb.append(");");
        return null;
    }

    @Override
    public Void visitMotorStopAction(MotorStopAction<Void> motorStopAction) {
        String port = motorStopAction.getUserDefinedPort();
        if ( motorStopAction.getMode() == MotorStopMode.FLOAT ) {
            this.sb.append("Float(" + getPrefixedOutputPort(port) + ");");
        } else {
            this.sb.append("Off(" + getPrefixedOutputPort(port) + ");");
        }
        return null;
    }

    @Override
    public Void visitMotorDriveStopAction(MotorDriveStopAction<Void> stopAction) {
        this.sb.append("Off(" + getDriveMotorPorts() + ");");
        return null;
    }

    @Override
    public Void visitCurveAction(CurveAction<Void> curveAction) {
        MotorDuration<Void> duration = curveAction.getParamLeft().getDuration();
        boolean isReverse = isReverseGivenBrickConfigurationAndAction(curveAction.getDirection());
        this.sb.append(duration != null ? "SteerDriveForDistance(" : "SteerDrive(");
        this.sb.append(getLeftDriveMotorPort() + ", " + getRightDriveMotorPort() + ", ");
        visitSpeedExpression(curveAction.getParamLeft().getSpeed(), isReverse);
        this.sb.append(", ");
        visitSpeedExpression(curveAction.getParamRight().getSpeed(), isReverse);
        if ( duration != null ) {
            this.sb.append(", ");
            duration.getValue().visit(this);
        }
        this.sb.append(");");
        return null;
    }

    @Override
    public Void visitTurnAction(TurnAction<Void> turnAction) {
        MotorDuration<Void> duration = turnAction.getParam().getDuration();
        Expr<Void> speedExpression = turnAction.getParam().getSpeed();
        int turn = getTurn(turnAction);
        if ( duration != null ) {
            generateTurnForDistance(speedExpression, duration.getValue(), turn);
        } else {
            generateTurn(speedExpression, turn);
        }
        return null;
    }

    private int getTurn(TurnAction<Void> turnAction) {
        /**
         * Turn is from -200 to 200
         * O: motor run at the same power
         * 100: one motor run at the specified power the other doesn't
         * 200: one motor run at the specified power and the other at negative power
         */
        int turn = 200;
        if ( isAnyDriveMotorReverse() ) {
            turn *= -1;
        }
        //if ( turnAction.getDirection() == TurnDirection.LEFT ) {
        if ( turnAction.getDirection() == TurnDirection.RIGHT ) {
            turn *= -1;
        }
        return turn;
    }

    private void generateTurnForDistance(Expr<Void> speedExpression, Expr<Void> distanceExpression, int turn) {
        this.sb.append("RotateMotorForAngleWithTurn(" + getDriveMotorPorts() + ", ");
        visitSpeedExpression(speedExpression);
        this.sb.append(", ");
        visitDistanceOfTurn(distanceExpression);
        this.sb.append(", " + turn + ");");
    }

    private void visitDistanceOfTurn(Expr<Void> distanceExpression) {
        this.sb.append("(");
        distanceExpression.visit(this);
        this.sb.append(" * TRACK_WIDTH / WHEEL_DIAMETER)");
    }

    private void generateTurn(Expr<Void> speedExpression, int turn) {
        this.sb.append("OnFwdSyncEx(" + getDriveMotorPorts() + ", ");
        visitSpeedExpression(speedExpression);
        this.sb.append(", " + turn + ", RESET_NONE);");

    }

    private void visitSpeedExpression(Expr<Void> speedExpression) {
        visitSpeedExpression(speedExpression, false);
    }

    private void visitSpeedExpression(Expr<Void> speedExpression, boolean reverse) {
        this.sb.append(reverse ? "-Speed(" : "Speed(");
        speedExpression.visit(this);
        this.sb.append(")");
    }

    private boolean isActorOnPort(String port) {
        if ( port != null ) {
            for ( UsedActor actor : this.usedActors ) {
                if ( actor.getPort().equals(port) ) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean isMotorReverse(String port) {
        String reverseProperty = this.brickConfiguration.getConfigurationComponent(port).getOptProperty(SC.MOTOR_REVERSE);
        return reverseProperty != null && reverseProperty.equals(SC.ON);
    }

    private String getDriveMotorPorts() {
        ConfigurationComponent leftMotor = this.brickConfiguration.getFirstMotor(SC.LEFT);
        ConfigurationComponent rightMotor = this.brickConfiguration.getFirstMotor(SC.RIGHT);
        String leftMotorPort = leftMotor.getUserDefinedPortName();
        String rightMotorPort = rightMotor.getUserDefinedPortName();
        return PREFIX_OUTPUT_PORT + createSortedPorts(leftMotorPort, rightMotorPort);
    }

    private static String createSortedPorts(String port1, String port2) {
        Assert.isTrue(port1.length() == 1 && port2.length() == 1);
        char[] charArray = (port1 + port2).toCharArray();
        Arrays.sort(charArray);
        String port = new String(charArray);
        return port;
    }

    private String getLeftDriveMotorPort() {
        return getPrefixedOutputPort(brickConfiguration.getFirstMotor(SC.LEFT).getUserDefinedPortName());
    }

    private String getRightDriveMotorPort() {
        return getPrefixedOutputPort(brickConfiguration.getFirstMotor(SC.RIGHT).getUserDefinedPortName());
    }

    private boolean isReverseGivenBrickConfigurationAndAction(IDriveDirection direction) {
        boolean reverse = isAnyDriveMotorReverse();
        boolean localReverse = direction == DriveDirection.BACKWARD;
        return (reverse && !localReverse) || (localReverse && !reverse);
    }

    private boolean isAnyDriveMotorReverse() {
        ConfigurationComponent leftMotor = this.brickConfiguration.getFirstMotor(SC.LEFT);
        ConfigurationComponent rightMotor = this.brickConfiguration.getFirstMotor(SC.RIGHT);
        return leftMotor.isReverse() || rightMotor.isReverse();
    }

    @Override
    public Void visitEncoderSensor(EncoderSensor<Void> encoderSensor) {
        String port = encoderSensor.getPort();
        switch ( encoderSensor.getMode() ) {
            case SC.DEGREE:
                generateGetEncoderInDegrees(port);
                break;
            case SC.ROTATION:
                generateGetEncoderInRotations(port);
                break;
            case SC.DISTANCE:
                generateGetEncoderInDistance(port);
                break;
            case SC.RESET:
                generateResetEncoder(port);
                break;
            default:
                throw new DbcException("Unknown encoder mode");
        }
        return null;
    }

    private void generateGetEncoderInDegrees(String port) {
        this.sb.append("MotorRotationCount(" + getPrefixedOutputPort(port) + ")");
    }

    private void generateGetEncoderInRotations(String port) {
        this.sb.append("(");
        this.generateGetEncoderInDegrees(port);
        this.sb.append(" / 360.0)");
    }

    private void generateGetEncoderInDistance(String port) {
        this.sb.append("(");
        this.generateGetEncoderInRotations(port);
        this.sb.append(" * M_PI * WHEEL_DIAMETER)");
    }

    private void generateResetEncoder(String port) {
        this.sb.append("ResetRotationCount(" + getPrefixedOutputPort(port) + ");");
    }

    @Override
    public Void visitTimerSensor(TimerSensor<Void> timerSensor) {
        String timerNumber = timerSensor.getPort();
        switch ( timerSensor.getMode() ) {
            case SC.DEFAULT:
            case SC.VALUE:
                generateGetTimer(timerNumber);
                break;
            case SC.RESET:
                generateResetTimer(timerNumber);
                break;
            default:
                throw new DbcException("Unknown timer mode");
        }
        return null;
    }

    private void generateGetTimer(String timerNumber) {
        this.sb.append("GetTimerValue(" + timerNumber + ")");
    }

    private void generateResetTimer(String timerNumber) {
        this.sb.append("ResetTimer(" + timerNumber + ");");
    }

    @Override
    public Void visitTouchSensor(TouchSensor<Void> touchSensor) {
        this.sb.append("readSensor(").append(getPrefixedInputPort(touchSensor.getPort())).append(")");
        return null;
    }

    @Override
    public Void visitUltrasonicSensor(UltrasonicSensor<Void> ultrasonicSensor) {
        String mode = getUltrasonicSensorModeConstant(ultrasonicSensor.getMode());
        generateReadSensorInMode(ultrasonicSensor.getPort(), mode);
        return null;
    }

    private String getUltrasonicSensorModeConstant(String mode) {
        if ( mode.equals(SC.DISTANCE) ) {
            return "US_DIST_CM";
        } else {
            return "US_LISTEN";
        }
    }

    @Override
    public Void visitSoundSensor(SoundSensor<Void> soundSensor) {
        generateReadSensor(soundSensor.getPort());
        return null;
    }

    @Override
    public Void visitGyroSensor(GyroSensor<Void> gyroSensor) {
        String port = gyroSensor.getPort();
        String mode = gyroSensor.getMode();
        if ( isGyroResetMode(mode) ) {
            generateResetGyroSensor(port);
        } else {
            generateReadSensorInMode(port, getGyroSensorReadModeConstant(mode));
        }
        return null;
    }

    private boolean isGyroResetMode(String mode) {
        return mode.equals(SC.RESET);
    }

    private String getGyroSensorReadModeConstant(String mode) {
        if ( mode.equals(SC.ANGLE) ) {
            return "GYRO_ANG";
        } else {
            return "GYRO_RATE";
        }
    }

    private void generateResetGyroSensor(String port) {
        this.sb.append("ResetGyroSensor(" + getPrefixedInputPort(port) + ");");
    }

    @Override
    public Void visitColorSensor(ColorSensor<Void> colorSensor) {
        if (isColorSensorInLightMode(colorSensor.getMode())) {
            visitColorSensorLightMode(colorSensor);
        } else {
            visitColorSensorColorMode(colorSensor);
        }
        return null;
    }

    private boolean isColorSensorInLightMode (String mode) {
        return mode.equals(SC.LIGHT) || mode.equals(SC.AMBIENTLIGHT);
    }

    private void visitColorSensorLightMode (ColorSensor<Void> colorSensor) {
        generateReadSensorInMode(colorSensor.getPort(), getColorSensorLightModeConstant(colorSensor.getMode()));
    }

    private void visitColorSensorColorMode (ColorSensor<Void> colorSensor) {
        String function = getReadColorSensorColorModeFunction(colorSensor.getMode());
        this.sb.append(function + "(" + getPrefixedInputPort(colorSensor.getPort()) + ")");
    }

    private String getColorSensorLightModeConstant(String mode) {
        switch ( mode ) {
            case SC.LIGHT:
                return "COL_REFLECT";
            case SC.AMBIENTLIGHT:
                return "COL_AMBIENT";
            default:
                throw new DbcException("Unknown color sensor light mode");
        }
    }

    private String getReadColorSensorColorModeFunction(String mode) {
        switch ( mode ) {
            case SC.RGB:
                return "ReadColorSensorRGB";
            case SC.COLOUR:
                return "ReadColorSensor";
            default:
                throw new DbcException("Unknown color sensor color mode");
        }
    }

    @Override
    public Void visitInfraredSensor(InfraredSensor<Void> infraredSensor) {
        String port = infraredSensor.getPort();
        switch ( infraredSensor.getMode() ) {
            case SC.DISTANCE:
                generateEV3IRDistance(port);
                break;
            case SC.PRESENCE:
                generateEV3IRSeeker(port);
                break;
            default:
                throw new DbcException("Unknown Infrared sensor mode");
        }
        return null;
    }

    @Override
    public Void visitCompassSensor(CompassSensor<Void> compassSensor) {
        if (isCompassCalibrateMode(compassSensor)) {
            visitCalibrateCompass(compassSensor);
        } else {
            visitReadCompass(compassSensor);
        }

        return null;
    }

    private boolean isCompassCalibrateMode (CompassSensor<Void> compassSensor) {
        return compassSensor.getMode().equals(SC.CALIBRATE);
    }

    private void visitCalibrateCompass (CompassSensor<Void> compassSensor) {
        String port = getPrefixedInputPort(compassSensor.getPort());
        nlIndent();
        this.sb.append("StartHTCompassCalibration(" + port +");");
        this.sb.append("Wait(40000);");
        this.sb.append("StopHTCompassCalibration(" + port + ");");
        nlIndent();
    }

    private void visitReadCompass (CompassSensor<Void> compassSensor) {
        String mode = getCompassSensorReadModeConstant(compassSensor.getMode());
        this.sb.append("ReadSensorInMode(" + getPrefixedInputPort(compassSensor.getPort()) + ", " + mode + ")");
    }

    private String getCompassSensorReadModeConstant(String mode) {
        switch ( mode ) {
            case SC.COMPASS:
                return "NXT_COMPASS_COMPASS";
            case SC.ANGLE:
                return "NXT_COMPASS_ANGLE";
            default:
                throw new DbcException("Unknown read compass mode");
        }
    }

    private void generateEV3IRDistance (String port) {
        generateReadSensorInMode(port, "IR_PROX");
    }

    private void generateEV3IRSeeker (String port) {
        this.sb.append("_ReadIRSeekAllChannels("+ getPrefixedInputPort(port) + ")");
    }

    @Override
    public Void visitIRSeekerSensor(IRSeekerSensor<Void> irSeekerSensor) {
        generateReadSensorInMode(irSeekerSensor.getPort(), getIRSeekerSensorModeConstant(irSeekerSensor.getMode()));
        return null;
    }

    private String getIRSeekerSensorModeConstant (String mode) {
        switch ( mode ) {
            case SC.MODULATED:
                return "NXT_IR_SEEKER_AC";
            case SC.UNMODULATED:
                return "NXT_IR_SEEKER_DC";
            default:
                throw new DbcException("Unknown IR seeker sensor mode");
        }
    }

    private void generateReadSensorInMode(String port, String mode) {
        this.sb.append("ReadSensorInMode(" + getPrefixedInputPort(port) + ", " + mode + ")");
    }

    private void generateReadSensor(String port) {
        this.sb.append("readSensor(" + getPrefixedInputPort(port) + ")");
    }

    @Override
    public Void visitKeysSensor(KeysSensor<Void> keysSensor) {
        this.sb.append("ButtonIsDown(" + getKeyConstant(keysSensor.getPort()) + ")");
        return null;
    }

    private String getKeyConstant (String keyPort) {
        switch ( keyPort ) {
            case SC.ENTER:
                return "BTNCENTER";
            case SC.RIGHT:
                return "BTNRIGHT";
            case SC.LEFT:
                return "BTNLEFT";
            case SC.UP:
                return "BTNUP";
            case SC.DOWN:
                return "BTNDOWN";
            case SC.ESCAPE:
                return "BTNEXIT";
            case SC.ANY:
                return "BTNANY";
            default:
                throw new DbcException("Unknown key port");
        }
    }

    @Override
    public Void visitClearDisplayAction(ClearDisplayAction<Void> clearDisplayAction) {
        this.sb.append("LcdClean();");
        return null;
    }

    @Override
    public Void visitShowTextAction(ShowTextAction<Void> showTextAction) {
        this.sb.append("DrawString(ToString(");
        showTextAction.getMsg().visit(this);
        this.sb.append("), ");
        showTextAction.getX().visit(this);
        this.sb.append(", ");
        showTextAction.getY().visit(this);
        this.sb.append(");");
        return null;
    }

    @Override
    public Void visitPlayFileAction(PlayFileAction<Void> playFileAction) {
        String soundConstant = getSoundConstantByFileName(playFileAction.getFileName());
        this.sb.append("PlaySystemSound(" + soundConstant + ");");
        return null;
    }

    private String getSoundConstantByFileName (String fileName) {
        switch ( fileName ) {
            case "0":
                return "SOUND_CLICK";
            case "1":
                return "SOUND_DOUBLE_BEEP";
            case "2":
                return "SOUND_DOWN";
            case "3":
                return "SOUND_UP";
            case "4":
                return "SOUND_LOW_BEEP";
            default:
                throw new DbcException("Unknown system sound file");
        }
    }

    @Override
    public Void visitPlayNoteAction(PlayNoteAction<Void> playNoteAction) {
        this.sb.append("NEPOPlayTone(" + playNoteAction.getFrequency() + ", " + playNoteAction.getDuration() + ");");
        return null;
    }

    @Override
    public Void visitVolumeAction(VolumeAction<Void> volumeAction) {
        switch ( volumeAction.getMode() ) {
            case SET:
                generateSetVolume(volumeAction);
                break;
            case GET:
                generateGetVolume();
                break;
            default:
                throw new DbcException("Unknown volume action mode");
        }
        return null;
    }

    private void generateSetVolume (VolumeAction<Void> volumeAction) {
        this.sb.append("SetVolume(");
        volumeAction.getVolume().visit(this);
        this.sb.append(");");
    }

    private void generateGetVolume () {
        this.sb.append("GetVolume()");
    }

    @Override
    public Void visitToneAction(ToneAction<Void> toneAction) {
        this.sb.append("NEPOPlayTone(");
        toneAction.getFrequency().visit(this);
        this.sb.append(", ");
        toneAction.getDuration().visit(this);
        this.sb.append(");");
        return null;
    }

    @Override
    public Void visitShowPictureAction(ShowPictureAction<Void> showPictureAction) {
        String picture = showPictureAction.getPicture().toString();
        this.sb.append("LcdPicture(LCD_COLOR_BLACK, 0, 0, " + picture + ");");
        // TODO: Implement
        return null;
    }

    @Override
    public Void visitLightAction(LightAction<Void> lightAction) {
        String pattern = getLedPattern(lightAction.getColor(), lightAction.getMode());
        this.sb.append("SetLedPattern(" + pattern + ");");
        return null;
    }

    private String getLedPattern(IBrickLedColor color, ILightMode mode) {
        return "LED_" + getLedPatternColorPrefix(color) + getLedPatternModePostfix(mode);
    }

    private String getLedPatternColorPrefix(IBrickLedColor color) {
        return color.toString();
    }

    private String getLedPatternModePostfix(ILightMode mode) {
        switch ( mode.toString() ) {
            case SC.ON:
                return "";
            case "FLASH":
                return "_FLASH";
            case "DOUBLE_FLASH":
                return "_PULSE";
            default:
                throw new DbcException("Unknown LightMode");
        }
    }

    @Override
    public Void visitLightStatusAction(LightStatusAction<Void> lightStatusAction) {
        switch ( lightStatusAction.getStatus() ) {
            case OFF:
                this.sb.append("SetLedPattern(LED_BLACK);");
                break;
            case RESET:
                // TODO: Implement
                break;
            default:
                throw new DbcException("Invalid LED status mode!");
        }
        return null;
    }

    @Override
    public Void visitBluetoothReceiveAction(BluetoothReceiveAction<Void> bluetoothReceiveAction) {
        this.sb.append("NEPOReceiveStringFrom(");
        bluetoothReceiveAction.getConnection().visit(this);
        this.sb.append(")");
        return null;
    }

    @Override
    public Void visitBluetoothConnectAction(BluetoothConnectAction<Void> bluetoothConnectAction) {
        this.sb.append("NEPOConnectTo(");
        bluetoothConnectAction.getAddress().visit(this);
        this.sb.append(")");
        return null;
    }

    @Override
    public Void visitBluetoothSendAction(BluetoothSendAction<Void> bluetoothSendAction) {
        this.sb.append("NEPOSendStringTo(");
        bluetoothSendAction.getConnection().visit(this);
        this.sb.append(", ");
        bluetoothSendAction.getMsg().visit(this);
        this.sb.append(");");
        return null;
    }

    @Override
    public Void visitBluetoothWaitForConnectionAction(BluetoothWaitForConnectionAction<Void> bluetoothWaitForConnection) {
        this.sb.append("NEPOWaitConnection()");
        return null;
    }

    @Override
    public Void visitBluetoothCheckConnectAction(BluetoothCheckConnectAction<Void> bluetoothCheckConnectAction) {
        return null;
    }

    @Override
    public Void visitSetLanguageAction(SetLanguageAction<Void> setLanguageAction) {
        this.sb.append("SetLanguage(\"");
        this.sb.append(TTSLanguageMapper.getLanguageString(setLanguageAction.getLanguage()));
        this.sb.append("\");");
        return null;
    }

    @Override
    public Void visitSayTextAction(SayTextAction<Void> sayTextAction) {
        this.sb.append("Say(ToString(");
        sayTextAction.getMsg().visit(this); // TODO: Handle cases where the expression is not a string
        this.sb.append("), ");
        this.generateSpeedAndPitchArgumentsOrDefault(sayTextAction);
        this.sb.append(");");
        return null;
    }

    private void generateSpeedAndPitchArgumentsOrDefault(SayTextAction<Void> sayTextAction) {
        Expr<Void> speed = sayTextAction.getSpeed();
        Expr<Void> pitch = sayTextAction.getPitch();
        if (!isExprEmptyBlock(speed) && !isExprEmptyBlock(pitch)) {
            generateSpeedAndPitchArguments(speed, pitch);
        } else {
            generateDefaultSpeedAndPitchArguments();
        }
    }

    private boolean isExprEmptyBlock(Expr<Void> expr) {
        BlockType emptyBlock = BlockTypeContainer.getByName("EMPTY_EXPR");
        return expr.getKind().equals(emptyBlock);
    }

    private void generateSpeedAndPitchArguments (Expr<Void> speed, Expr<Void> pitch) {
        speed.visit(this);
        this.sb.append(", ");
        pitch.visit(this);
    }

    private void generateDefaultSpeedAndPitchArguments () {
        this.sb.append("30, 50");
    }
}
