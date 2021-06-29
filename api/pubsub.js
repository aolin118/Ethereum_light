const Pubnub = require('pubnub');
const Transaction = require('../transaction');

const credentials = {
	publishKey:'pub-c-23e24bca-876b-4e23-a51c-1fea43650a5f',
	subscribeKey:'sub-c-8baf399c-d180-11eb-b6c2-0298fc8e4944',
	secretKey:'sec-c-NDQyOWE0NzctMDcxNC00ZDEyLTkyNjUtNDQ5N2Q5ZDllYjQ1'
}

const CHANNELS_MAP = {
	TEST:'TEST',
	BLOCK: 'BLOCK',
	TRANSACTION:'TRANSACTION'
}

class PubSub {
	constructor(blockchain, transactionQueue) {
		this.pubnub = new Pubnub(credentials);
		this.blockchain = blockchain;
		this.transactionQueue = transactionQueue;
		this.subscribeToChannels();
		this.listen();
	}

	subscribeToChannels() {
		this.pubnub.subscribe({
			channels: Object.values(CHANNELS_MAP)
		});
	}

	publish({ channel, message}) {
		this.pubnub.publish({channel, message});

	}

	listen() {
		this.pubnub.addListener({
			message: messageObject => {
				const { channel, message} = messageObject;
				console.log('Message received. Channel:', channel);
				const parsedMessage = JSON.parse(message);

				switch(channel) {
					case CHANNELS_MAP.BLOCK:
					console.log('block message', message);
					this.blockchain.addBlock({
						block:parsedMessage,
						transactionQueue: this.transactionQueue
					})
					.then(() => {console.log('New block accepted', parsedMessage)}).
					catch(error => {console.error('New block rejected', error.message)})
					break;

					case CHANNELS_MAP.TRANSACTION:
	
					console.log(`Received transaction: ${parsedMessage.id}`);
					this.transactionQueue.add(new Transaction(parsedMessage));

					// console.log(
					// 	'this.transaction.getTransactionSeries()',
					// 	this.transactionQueue.getTransactionSeries()
					// 	);
					break;

					case CHANNELS_MAP.TEST:
					console.log('TEST');

					break;

					default:
					return;
				}

			}
		})
	}

	broadcastBlock(block) {
		this.publish({
			channel: CHANNELS_MAP.BLOCK,
			message: JSON.stringify(block)
		});
	}

	broadcastTransaction(transaction) {
		this.publish({
			channel: CHANNELS_MAP.TRANSACTION,
			message: JSON.stringify(transaction)
		})
	}

	broadcastTest(message) {
		this.publish({
			channel: CHANNELS_MAP.TEST,
			message: 'message'
		})
	}

}


module.exports = PubSub;

// const pubsub = new PubSub();
// const Account = require('../account')
// const account = new Account()
// const transaction = Transaction.createTransaction({account})
// setTimeout(() => {
// 	pubsub.broadcastTransaction(transaction)
// }, 300);