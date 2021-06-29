const STOP = 'STOP';
const ADD = 'ADD';
const PUSH = 'PUSH';
const SUB = 'SUB';
const MUL = 'MUL';
const DIV = 'DIV';
const GT = 'GT';
const LT = 'LT';
const EQ = 'EQ';
const AND = 'AND';
const OR = 'OR';
const JUMP = 'JUMP';
const JUMPI = 'JUMPI';
const STORE = 'STORE';
const LOAD = 'LOAD';


const EXECUTION_COMPLETE = 'Execution complete';
const EXECUTION_LIMIT = 10000

const OPCODE_MAP = {
 STOP,
 ADD,
 PUSH,
 SUB,
 MUL,
 DIV,
 GT,
 LT,
 EQ,
 AND,
 OR,
 JUMP,
 JUMPI,
 STORE,
 LOAD,
 EXECUTION_COMPLETE,
 EXECUTION_LIMIT 
};

const OPCODE_GAS_MAP = {
  STOP: 0,
  ADD: 1,
  PUSH: 0,
  SUB: 1,
  MUL:1,
  DIV: 1,
  GT: 1,
  LT: 1,
  EQ: 1,
  AND: 1,
  OR: 1,
  JUMP: 2,
  JUMPI: 2,
  STORE: 5,
  LOAD: 5
}


class Interpreter {
  constructor({storageTrie} = {} ) {
    this.state = {
      programCounter: 0,
      stack: [],
      code: [],
      executionCounter: 0
    };
    this.storageTrie = storageTrie;
  }
  jump() {
   const destination = this.state.stack.pop();
   if (destination < 0 || destination > this.state.code.length) {
     // console.log(destination  )

     throw new Error('Invalid destination');
   }
   this.state.programCounter = destination;
   this.state.programCounter--;
 }
 runCode(code) {
  this.state.code = code;


  let gasUsed = 0;

  while (this.state.programCounter < this.state.code.length) {
    this.state.executionCounter++;
    if(this.state.executionCounter > EXECUTION_LIMIT){
      throw new Error('Excess execution limit');
    }
    const opCode = this.state.code[this.state.programCounter];

    gasUsed += OPCODE_GAS_MAP[opCode];
    let value;
    let key;
    try {
      switch (opCode) {
        case STOP:
        throw new Error('Execution complete');

        case PUSH:
        this.state.programCounter++;

        if(this.state.programCounter == this.state.code.length){
          throw new Error('the command "PUSH" cannot be the last')
        }
        value = this.state.code[this.state.programCounter];
        this.state.stack.push(value);
        break;

        case JUMP:
        this.jump();
        break;

        case JUMPI:
        const condition = this.state.stack.pop();
        if(condition ===1) {
          this.jump();
          break;
        }



        case ADD:
        case SUB:
        case MUL:
        case DIV:
        case LT:
        case GT:
        case EQ:
        case AND:
        case OR:
        const a = this.state.stack.pop();
        const b = this.state.stack.pop();
        let result;
            //[b, a]
            if(opCode === ADD)  result = a + b;
            if(opCode === SUB)  result = a - b;
            if(opCode === MUL)  result = a * b;
            if(opCode === DIV)  result = a / b;
            if(opCode === LT)  result = a < b ? 1 : 0;
            if(opCode === GT)  result = a > b ? 1 : 0;
            if(opCode === EQ)  result = a === b ? 1 : 0;
            if(opCode === AND)  result = a && b;
            if(opCode === OR)  result = a || b;


            this.state.stack.push(result);
            break;
            
            case STORE:
            key = this.state.stack.pop();
            value = this.state.stack.pop();

            this.storageTrie.put({key, value})
            break;


            case LOAD:
            key = this.state.stack.pop();
            value = this.storageTrie.get({key});
      
            this.state.stack.push(value)
            break;
            default:
            break;
          }
        } catch (error) {
          if(error.message === EXECUTION_COMPLETE ){

            return {
              result: this.state.stack[this.state.stack.length-1] ,
              gasUsed
            };

          }
          throw error;

        }

        this.state.programCounter++;
      }
    }
  }

  // const code = [PUSH, 0, PUSH, 1, JUMPI, PUSH, 0, JUMP, PUSH, 'jump successful', STOP];
  // const code = [PUSH];

  Interpreter.OPCODE_MAP = OPCODE_MAP;

  module.exports = Interpreter;

  // try{
  //   new Interpreter().runCode(code);
  // } catch (error) {
  //   console.log(error.message);
  // }

