var Web3 = require('web3');
var wait = require('wait.for');
var BigNumber = require('bignumber.js');
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://127.0.0.1:8545'));
var runRewardsCalc = function() {
	var LATEST_BLOCK = wait.for(web3.eth.getBlock,'latest').number;
	var STARTING_BLOCK = LATEST_BLOCK - 6008; //60*24*(60/14.38)=6008 (1 day)
	console.log("LATEST BLOCK", LATEST_BLOCK);
	console.log("STARTING BLOCK", STARTING_BLOCK);
	var uncleReward = new BigNumber(0);
	var txReward = new BigNumber(0);
	var blockReward = new BigNumber(0);
	for (var i = STARTING_BLOCK; i < LATEST_BLOCK; i++) {
		var blockInfo = wait.for(web3.eth.getBlock, i);
		console.log(LATEST_BLOCK - i + " PROCESSING BLOCK", blockInfo.number);
		var uncleHashes = blockInfo.uncles;
		var tBlockReward = new BigNumber(5 + (5 * 0.03125 * uncleHashes.length));
		blockReward = blockReward.plus(tBlockReward);
		var tUncleReward = new BigNumber(0);
		for (var j = 0; j < uncleHashes.length; j++) {
			var uncleInfo = wait.for(web3.eth.getUncle,blockInfo.hash,j);
			tUncleReward = tUncleReward.plus((uncleInfo.number + 8 - blockInfo.number) * 5 / 8);
		}
		uncleReward = uncleReward.plus(tUncleReward);
		var txHashes = blockInfo.transactions;
		var tTxReward = new BigNumber(0);
		for (j = 0; j < txHashes.length; j++) {
			var txInfo = wait.for(web3.eth.getTransaction, txHashes[j]);
			var gasPrice = txInfo.gasPrice;
			txInfo = wait.for(web3.eth.getTransactionReceipt, txHashes[j]);
			tTxReward = tTxReward.plus(gasPrice.mul(txInfo.gasUsed));
		}
		txReward = txReward.plus(tTxReward);
		console.log("BLOCK REWARD", tBlockReward.toNumber(), "NUMBER OF UNCLES", uncleHashes.length, "UNCLE REWARD", tUncleReward.toNumber(), "TX REWARD", web3.fromWei(tTxReward, 'ether').toNumber());
	}
	var totalUncleRewards = uncleReward.toNumber();
	var totalTxRewards = web3.fromWei(txReward, 'ether').toNumber();
	var totalBlockRewards = blockReward.toNumber();
	console.log("UNCLE REWARDS", totalUncleRewards);
	console.log("TX REWARDS", totalTxRewards);
	console.log("BLOCK REWARDS", totalBlockRewards);
	console.log("RATIO", totalTxRewards / (totalUncleRewards + totalTxRewards + totalBlockRewards));
}
wait.launchFiber(runRewardsCalc); 