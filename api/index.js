const express = require('express');
const Blockchain = require('../blockchain');
const Block = require('../blockchain/block')
const PubSub = require('./pubsub');
const request = require('request')
const bodyParser = require('body-parser');
const Account = require('../account');
const Transaction = require('../transaction');
const TransactionQueue = require('../transaction/transaction-queue');
const State = require('../store/state');

const app = express();
app.use(bodyParser.json());

const state = new State();
// console.log(state);
const blockchain = new Blockchain({ state });
const account = new Account();
const transactionQueue = new TransactionQueue();
const pubsub = new PubSub(blockchain, transactionQueue);
const transaction = Transaction.createTransaction({account});

// console.log(transaction)
setTimeout(() =>{
	pubsub.broadcastTransaction(transaction);

},2000);

// transactionQueue.add(transaction);

// console.log(
// 	'transactionQueue.getTransactionSeries()',
// 	transactionQueue.getTransactionSeries()
// 	)




app.get('/blockchain', (req, res, next) => {
	const {chain} = blockchain;
	res.json({ chain });
});

app.get('/blockchain/mine', (req, res, next) => {
	const lastBlock = blockchain.chain[blockchain.chain.length-1];
	const block = Block.mineBlock({ 
		lastBlock,
		beneficiary: account.address,
		transactionSeries: transactionQueue.getTransactionSeries(),
		stateRoot: state.getStateRoot()
		 });
	blockchain.addBlock({block, transactionQueue})
	.then(() => {
		pubsub.broadcastBlock(block);
		res.json({ block });
	})
	.catch(next);
})

app.post('/account/transact', (req, res, next) => {
	const { code, gasLimit, to, value} = req.body;
	const transaction = Transaction.createTransaction({
		account: !to? new Account( {code} ) : account,
		gasLimit,
		to,
		value
	});
	pubsub.broadcastTransaction(transaction);

	res.json({transaction});
})

app.get('/account/balance', (req, res, next) => {

	const { address} = req.query;

	const balance = Account.calculateBalance({
		address: address || account.address,
		state
	});

	res.json({ balance });
})


app.use((err, req, res, next) => {
	console.log("Internal server eroor:", err);
	res.json({message: err.message});
})



// const PORT = 3000;
const peer = process.argv.includes('--peer');

// const PORT = process.argv.includes('--peer')? 2000 : 2500;
const PORT = peer? Math.floor(2000 + Math.random()*1000) : 3000;

if(peer){
	request('http://localhost:3000/blockchain', (error, response, body) =>{
		const { chain } = JSON.parse(body);
		
		blockchain.replaceChain({chain})
		.then(() => {console.log('Synchronized blockchain with the root chain')})
		.catch(() => {console.log('Synchronization errors')});
	});
}


app.listen(PORT, () => {
	console.log(`Listening at Port: ${PORT}`);
});