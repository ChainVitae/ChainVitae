var express = require('express');
var router = express.Router();

const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
const bs58 = require('bs58');
var abi = fs.readFileSync('../../chainvitae.abi').toString();
var accounts = web3.eth.accounts;
var address = fs.readFileSync('../../addr').toString().trim();
var contract = web3.eth.contract(JSON.parse(abi)).at(address);
if (contract == undefined) throw new Error("contract undefined");

function regStatus(contract, accounts){
	console.log("isEmployee:");
	for (var i = 0; i < accounts.length; i++){
		console.log(accounts[i] + ": " + contract.isEmployee.call(accounts[i]));
	}
	console.log("isInstitution:");
	for (var i = 0; i < accounts.length; i++){
		console.log(accounts[i] + ": " + contract.isInstitution.call(accounts[i]));
	}
}

function vitaeStatus(vitae){
	console.log(vitae);
	console.log('\tEmployee:\t'+
		web3.toAscii(contract.getEmployeeName.call(vitae)));
	console.log('\tInstitution:\t'+
		web3.toAscii(contract.getInstitutionName.call(vitae)));
	console.log('\tPosition:\t'+
		web3.toAscii(contract.getPosition.call(vitae)));
	console.log('\tFrom:\t\t'+
		contract.getStartTime.call(vitae)+
		' to '+
		contract.getEndTime.call(vitae));
}

function accStatus(contract, acc){
	console.log(acc + ":");
	if (contract.isEmployee.call(acc)){
		console.log("Pending:");
		var cur = 0;
		while (true){
			cur = contract.getNextPending.call(cur, {from: acc});
            if (cur == 0 || cur === '0x'){
				console.log('=== End ===');
				break;
			}
			vitaeStatus(cur);
		}
		console.log("Vitaes:");
		cur = 0;
		while (true){
			cur = contract.getNextVitae.call(cur, acc, {from: acc});
            if (cur == 0 || cur === '0x'){
				console.log('=== End ===');
				break;
			}
			vitaeStatus(cur);
		}
	}
	else if (contract.isInstitution.call(acc)){
		console.log("Requests:");
		var cur = 0;
		while (true){
			cur = contract.getNextRequest.call(cur, {from: acc});
            if (cur == 0 || cur === '0x'){
				console.log('=== End ===');
				break;
			}
			vitaeStatus(cur);
		}
		console.log("Endorsed:");
		cur = 0;
		while (true){
			cur = contract.getNextEndorsed.call(cur, {from: acc});
            if (cur == 0 || cur === '0x'){
				console.log('=== End ===');
				break;
			}
			vitaeStatus(cur);
		}
	}
	console.log();
}

function allStatus(contract, accounts){
	for (var i = 0; i < accounts.length; i++){
		var acc = accounts[i];
		accStatus(contract, acc);
	}
}

function getVitaes(acc, n, console) {
  var cur = 0;
  var vitaes = [];
  while (n >= 0){
    cur = contract.getNextPending.call(cur, {from: acc});
    if (cur == 0 || cur === '0x'){
      console.log('=== End ===');
      break;
    }
    var institutionAddr = contract.getInstitutionAddr.call(cur);
    vitaes.push({
      institution : web3.toAscii(contract.getName.call(institutionAddr)).replace(/\0/g, ''),
      institutionAddr : ec(institutionAddr),
      position : web3.toAscii(contract.getPosition.call(cur)).replace(/\0/g, ''),
      academic : contract.getAcademic.call(cur),
      from : new Date(contract.getStartTime.call(cur).c[0]).toDateString().substring(4),
      to : new Date(contract.getEndTime.call(cur).c[0]).toDateString().substring(4),
      hash : cur
    });
    n--;
  }
  return vitaes;
}

function ec(hex){
    return bs58.encode(Buffer.from(hex.substring(2), 'hex'));
}
function dc(b58){
    if (b58 === undefined) return undefined;
    return "0x" + bs58.decode(b58).toString('hex');
}
/* GET home page. */
router.get('/', function(req, res, next) {
	var employee = dc(req.query.addr);
    if (employee === undefined || !contract.isEmployee.call(employee)){
        res.redirect('/');
    }
    var acc = [];
    for (var i=0; i < accounts.length; i++){
        var tmp = web3.toAscii(contract.getName.call(accounts[i])).replace(/\0/g, '');
        var role;
        if (tmp.length === 0){
            tmp = '**************Not Registered**************';
            role = "";
        }
        else{
            role = contract.isEmployee.call(accounts[i])?'  (Employee)':'   (Institution)';
        }
        acc.push({
            name: tmp,
            addr: ec(accounts[i]),
            role: role
        });
    }
	res.render('request', { title: 'Express', accounts: acc, employee: employee});
});

router.get('/ajax', function(req, res, next) {
	var employee = dc(req.query.addr);
    var pendingVitaes = [];
    if (employee != null){
        if (contract.isEmployee.call(employee)){
            pendingVitaes = getVitaes(employee, 3, console);
        }
    }
    console.log(typeof(pendingVitaes));
	res.send(pendingVitaes);
});

router.post('/submit', function(req, res, next) {
    console.log(req.body);
    var employee = dc(req.body.employee);
	if (web3.personal.unlockAccount(employee)){
        console.log('a')
  		contract.request(
		    dc(req.body.institution),
		    web3.fromAscii(req.body.position),
		    typeof req.body.academic !== 'undefined',
		    new Date(req.body.start).getTime(),
		    new Date(req.body.end).getTime(),
		    {from: employee, gas: 400000}
        );
		res.redirect('/request?addr='+ req.body.employee);
	}
})

router.get('/cancel', function(req, res, next){
    var employee = dc(req.query.addr);
    if (web3.personal.unlockAccount(employee)){
        contract.cancel(
            req.query.hash,
            {from: employee, gas: 400000}
        );
    }
    res.redirect('/request?addr='+ req.query.addr);
})

router.get('/search', function(req, res, next){
    if (req.query.addr === ''){
        res.send('');
        return;
    }
    var institution = dc(req.query.addr);
    if (contract.isInstitution.call(institution)){
        var institutionName = web3.toAscii(contract.getName.call(institution)).replace(/\0/g,'');
        if (institutionName.length !== 0){
            res.send(institutionName);
            return;
        }
    }
    res.send('');
})
module.exports = router;
