const Block = require('./block');
const { keccakHash } = require('../util');
const State = require('../store/state');

describe('Block', () => {
	describe('calculateBlockTargetHash()', () => {
		it('calculate the maximum hash when the last block difficulty is 1', () => {
			expect(Block.calculateBlockTargetHash({ lastBlock: { blockHeaders: {difficulty: 1}}})
				)
			.toEqual('f'.repeat(64));
			
		});

		it('calculate the maximum hash when the last block difficulty is high', () => {
			expect(Block.calculateBlockTargetHash({ lastBlock: { blockHeaders: {difficulty: 20000}}})
				< '1'
				)
			.toBe(true);
			
		})


	})


	describe('mineBlock()', () => {
		let lastBlock, minedBlock;

		beforeEach(() => {
			lastBlock = Block.genesis();
			minedBlock = Block.mineBlock({ lastBlock, beneficiary: 'beneficiary', transactionSeries:[]});
			

			
		});

		it('mines a block', () => {
			expect(minedBlock).toBeInstanceOf(Block);
			
		});

		it('mines a block that meets the requirement of proof of work', () => {
			const target = Block.calculateBlockTargetHash({ lastBlock });
			const { blockHeaders } = minedBlock;
			const { nonce } = blockHeaders;
			const truncatedBlockHeaders = {...blockHeaders};
			delete truncatedBlockHeaders.nonce;
			const header = keccakHash(truncatedBlockHeaders);
			const underTargetHash = keccakHash(header + nonce);

			expect(underTargetHash < target).toBe(true);
		})


	})

	describe('adjustDifficulty()', () => {

		it('keeps the difficulty above 0', () => {
			expect(Block.adjustDifficulty({
				lastBlock: {blockHeaders: {difficulty : 0}},
				timestamp: Date.now()
			})).toEqual(1);
			
		});

		it('increase difficulty while mining is quick', () => {
			expect(Block.adjustDifficulty({
				lastBlock: {blockHeaders: {timestamp: 1000, difficulty: 5}},
				timestamp: 2000
			})).toEqual(6);
			
		});

		it('decrease difficulty while mining is slow', () => {
			expect(Block.adjustDifficulty({
				lastBlock: {blockHeaders: {timestamp: 1000, difficulty: 5}},
				timestamp: 100000
			})).toEqual(4);
			
		});


	})



	describe('validateBlock()', () => {

		it('resolves with genesis block', () => {
			expect(Block.validateBlock({
				block: Block.genesis(),
				state
			})).resolves;
		})

		let block, lastBlock, state;
		beforeEach(() => {

			lastBlock = Block.genesis();
			block = Block.mineBlock({lastBlock,
				beneficiary: "foo",
				transactionSeries:[]
			});
			state = new State();
		})
		

		it('resolves with valid block', () => {
			expect(Block.validateBlock({lastBlock, block, state})).resolves;
		})

		it('rejects with the parentHash is invalid', () =>{
			block.blockHeaders.parentHash= 'foo';
			expect(Block.validateBlock({lastBlock, block}))
			.rejects
			.toMatchObject({
				message:'The parent hash must be a hash of the previous block'
			});
		})

		it('rejects with the block number is invalid', () =>{
			block.blockHeaders.number = 500;
			expect(Block.validateBlock({lastBlock, block, state}))
			.rejects
			.toMatchObject({
				message:'Block number must increment number by 1'
			});
		})

		it('rejects with the difficulty is invalid', () =>{
			block.blockHeaders.difficulty = 800;
			expect(Block.validateBlock({lastBlock, block, state}))
			.rejects
			.toMatchObject({
				message:'Difficulty adjustment errors'
			});
		})

		it('rejects with the Proof of Work is not met', () =>{

			const originalCalculateBlockTargetHash = Block.calculateBlockTargetHash;

			Block.calculateBlockTargetHash = () => {
				return '0'.repeat(64);
			}


			expect(Block.validateBlock({lastBlock, block}))
			.rejects
			.toMatchObject({
				message:'The requirement of Proof of Work does not met'
			});

			Block.calculateBlockTargetHash = originalCalculateBlockTargetHash;
		})
		
		it('rejects when the transactionSeries is not valid', () => {
			block.transactionSeries = ['foo'];
			expect(Block.validateBlock({state, lastBlock, block}))
			.rejects
			.toMatchObject({
				message:/rebuilt transactions root does not match/
			})
		})

	})
})