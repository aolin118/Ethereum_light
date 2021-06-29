const { GENESIS_DATA, MINE_RATE } = require('../config');
const { keccakHash } = require('../util');
const Transaction = require('../transaction');
const Trie = require('../store/trie');

const HASH_LENGTH = 64;
const MAX_HASH_VALUE = parseInt('f'.repeat(64),16);
const MAX_NONCE_VALUE = 2 ** 64;


class Block {
	constructor({ blockHeaders, transactionSeries}) {
		this.blockHeaders = blockHeaders;
		this.transactionSeries = transactionSeries;
	}

	static calculateBlockTargetHash( { lastBlock } ) {
		const value = (MAX_HASH_VALUE / lastBlock.blockHeaders.difficulty).toString(16);

		// const value = (MAX_HASH_VALUE / 5000).toString(16);

		if(value.length > HASH_LENGTH) {
			return 'f'.repeat(64);
		}

		return '0'.repeat(HASH_LENGTH-value.length) + value
	}

	static adjustDifficulty({ lastBlock, timestamp }) {
		const { difficulty } = lastBlock.blockHeaders;
		if(( timestamp - lastBlock.blockHeaders.timestamp) > MINE_RATE){ 
			return difficulty - 1;
		}

		if (difficulty < 1) {
			return 1;
		}
		return difficulty + 1;

	}


	static mineBlock( { lastBlock, beneficiary, transactionSeries, stateRoot } ) {
		const target = Block.calculateBlockTargetHash({ lastBlock });

		const miningRewardTransaction = Transaction.createTransaction({
			beneficiary
		});

		transactionSeries.push(miningRewardTransaction);
		
		const transactionsTrie = Trie.buildTrie({items:transactionSeries });
		let timestamp, truncatedBlockHeaders, header, nonce, underTargetHash;

		do {
			timestamp = Date.now();
			truncatedBlockHeaders = {
				parentHash: keccakHash( lastBlock.blockHeaders),
				beneficiary,
				difficulty: Block.adjustDifficulty({ lastBlock, timestamp }),
				number: lastBlock.blockHeaders.number + 1,
				timestamp,
				/**
				* NOTE: the 'transactionRoot' will be refactored once Tries are implemented

				*/
				transactionsRoot: transactionsTrie.rootHash,
				stateRoot
			}
			header = keccakHash(truncatedBlockHeaders);
			nonce = Math.floor(Math.random() * MAX_NONCE_VALUE);

			underTargetHash = keccakHash(header + nonce);
		} while ( underTargetHash > target )

		if (underTargetHash < target) {
			return new this({
				blockHeaders: {
					...truncatedBlockHeaders,
					nonce
				},
				transactionSeries
			})
		}
	}


	static validateBlock({ lastBlock, block, state}) {
		return new Promise((resolve, reject)=> {
			if(keccakHash(block) === keccakHash(Block.genesis())){
				return resolve();
			}

			if(keccakHash(lastBlock.blockHeaders) !== block.blockHeaders.parentHash){
				return reject(new Error("The parent hash must be a hash of the previous block"));
			}

			if(Math.abs(lastBlock.blockHeaders.difficulty - block.blockHeaders.difficulty) > 1){
				return reject(new Error("Difficulty adjustment errors"));
			}

			if(block.blockHeaders.number - lastBlock.blockHeaders.number !==1) {
				return reject(new Error("Block number must increment number by 1"));
			}



			const rebuiltTransactionsTrie = Trie.buildTrie({
				items: block.transactionSeries
			});

			if (rebuiltTransactionsTrie.rootHash !== block.blockHeaders.transactionsRoot) {
				return reject(
					new Error(
						`The rebuilt transactions root does not match the block's` +
						`transactions root: ${block.blockHeaders.transactionRoot}`
						))
			}

			const target = Block.calculateBlockTargetHash({ lastBlock });
			const { blockHeaders } = block;
			const { nonce } = blockHeaders;
			const truncatedBlockHeaders = {...blockHeaders};
			delete truncatedBlockHeaders.nonce;
			const header = keccakHash(truncatedBlockHeaders);
			const underTargetHash = keccakHash(header + nonce);
			if (underTargetHash > target) {
				return reject(new Error("The requirement of Proof of Work does not met"))
			}

			Transaction.validateTransactionSeries({
				state, transactionSeries: block.transactionSeries
			}).then(resolve)
			.catch(reject);

					
		})
	}

	static runBlock({block, state}){
		for (let transaction of block.transactionSeries) {
			Transaction.runTransaction( {transaction, state})
		}
	}





	static genesis() {
		return new this(GENESIS_DATA);
	}
}


module.exports = Block;

