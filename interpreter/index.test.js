const Interpreter = require('./index');
const Trie = require('../store/trie');

const {
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
} = Interpreter.OPCODE_MAP;

describe('Interpreter', () => {
	describe('runCode()', () => {
		describe('and the code includes ADD', () => {
			it('adds two values', () => {
				expect(
					new Interpreter().runCode([PUSH,2,PUSH,3, ADD, STOP]).result
					).toEqual(5);
			})
		})

		describe('and the code includes SUB', () => {
			it('sub one value from another', () => {
				expect(
					new Interpreter().runCode([PUSH,2,PUSH,3, SUB, STOP]).result
					).toEqual(1);
			})
		})

		describe('and the code includes MUL', () => {
			it('product two values', () => {
				expect(
					new Interpreter().runCode([PUSH,2,PUSH,3, MUL, STOP]).result
					).toEqual(6);
			})
		})

		describe('and the code includes DIV', () => {
			it('divide one value from another', () => {
				expect(
					new Interpreter().runCode([PUSH,2,PUSH,3, DIV, STOP]).result
					).toEqual(3/2);
			})
		})

		describe('and the code includes LT', () => {
			it('check one value less than another', () => {
				expect(
					new Interpreter().runCode([PUSH,2,PUSH,3, LT, STOP]).result
					).toEqual(0);
			})
		})

		describe('and the code includes GT', () => {
			it('check one value large than another', () => {
				expect(
					new Interpreter().runCode([PUSH,2,PUSH,3, GT, STOP]).result
					).toEqual(1);
			})
		})

		describe('and the code includes EQ', () => {
			it('check one value equal with another', () => {
				expect(
					new Interpreter().runCode([PUSH,2,PUSH,3, EQ, STOP]).result
					).toEqual(0);
			})
		})

		describe('and the code includes AND', () => {
			it('ands two values', () => {
				expect(
					new Interpreter().runCode([PUSH,1,PUSH,0, AND, STOP]).result
					).toEqual(0);
			})
		})

		describe('and the code includes OR', () => {
			it('ors two values', () => {
				expect(
					new Interpreter().runCode([PUSH,1,PUSH,0, OR, STOP]).result
					).toEqual(1);
			})
		})

		describe('and the code includes JUMP', () => {
			it('jump to a destination', () => {
				expect(
					new Interpreter().runCode([PUSH,6, JUMP, PUSH, 0, JUMP, PUSH, 'jump successful' , STOP]).result
					).toEqual('jump successful');
			})
		})

		describe('and the code includes JUMPI', () => {
			it('jump to a destination conditionally', () => {
				expect(
					new Interpreter().runCode([PUSH, 8, PUSH, 1, JUMPI, PUSH, 0, JUMP, PUSH, 'jump successful', STOP]).result
					).toEqual('jump successful');
			})
		})

		describe('and the code includes STORE', () => {
			it(`stores a value`, () => {
				const interpreter = new Interpreter({
					storageTrie: new Trie()
				});
				const key = 'foo';
				const value = 'bar';

				interpreter.runCode([PUSH, value, PUSH, key, STORE, STOP]);
				expect(interpreter.storageTrie.get({key})).toEqual(value);
			});
		});

		describe('and the code includes LOAD', () => {
			it(`loads a value`, () => {
				const interpreter = new Interpreter({
					storageTrie: new Trie()
				});
				const key = 'foo';
				const value = 'bar';

				
				expect(interpreter.runCode([PUSH, value, PUSH, key, STORE, PUSH, key, LOAD, STOP]).result)
				.toEqual(value);
			});
		});


		describe('and the code includes an invalid JUMP destination', () => {
			it('throw an error', () => {
				expect(
					() => {new Interpreter().runCode([PUSH, 99, PUSH, 1, JUMPI, PUSH, 0, JUMP, PUSH, 'jump successful', STOP])
				}
				).toThrow('Invalid destination');
			})
		})

		describe('and the code includes an invalid PUSH ', () => {
			it('throw an error', () => {
				expect(
					() => {new Interpreter().runCode([PUSH]).result
					}
					).toThrow('the command "PUSH" cannot be the last');
			})
		})

		describe('and the code includes an infinnite loop ', () => {
			it('throw an error', () => {
				expect(
					() => {new Interpreter().runCode([PUSH, 0, JUMP, STOP])
					}
					).toThrow('Excess execution limit');
			})
		})


	})


})