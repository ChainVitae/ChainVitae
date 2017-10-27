const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
var accounts = web3.eth.accounts;
var contract;
if (web3.personal.unlockAccount(accounts[0])){
	console.log('deploying new contract...');
	console.log('make sure miner has started...');
	contract = web3.eth.contract(JSON.parse(fs.readFileSync('chainvitae.abi').toString())).new({
		from: accounts[0],
		data: '0x' + fs.readFileSync('chainvitae.bin').toString(),
		gas: '4700000'
	}, function(e, c){
		if (e) throw e;
		if (typeof c.address !== 'undefined'){
			fs.writeFile('addr', c.address);
			console.log('contract mined!');
		}
	});
}
