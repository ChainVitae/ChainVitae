pragma solidity ^0.4.17;
contract ChainVitae{

    /*
     * node
     *
     * prev0: key to previous node of employee's hashlist (relative to this node)
     * prev1: key to previous node of institution's hashlist (relative to this node)
     * data: an vitae item
     * next0: key to next node of employee's hashlist (relative to this node)
     * next1: key to next node of institution's hashlist (relative to this node)
     *
     * Chained nodes form a hashlist.
     *
     * Example:
     *     Employee's (not) endorsed hashlist:
     *         A -> N -> B -> null, where A means a node with vitae item A.
     *     Institution's (not) endorsed hashlist:
     *         I -> N -> J -> null
     *
     *     Then N == node{
     *         prev0: hash(A),
     *         prev1: hash(I),
     *         data: N,
     *         next0: hash(B),
     *         next1: hash(J)}
     */
    struct node{
        bytes32 prev0;
        bytes32 prev1;
        vitae data;
        bytes32 next0;
        bytes32 next1;
    }

    /*
     * vitae
     *
     * employeeAddr: employee's address attached to this vitae item.
     * intitutionAddr: institution's address attached to this vitae item.
     * positionName: employee's pose name of this vitae item.
     * startTime: timestamp of 00:00 of the day on which this vitae item starts.
     * endTime: timestamp of 00:00 of the day which this vitae item ends.
     */
    struct vitae{
        address employeeAddr;
        address institutionAddr;
        bytes32 positionName;
        bool academic;
        uint startTime;
        uint endTime;
    }

    /*
     * head [Addr] [Endorsed]
     *
     * Addr: address of an user (employee or institution)
     * Endorsed:
     *     0: not endorsed yet
     *     1: endorsed already
     * head[Addr][Endorsed]: key to start of user(Addr)'s hashlist of (not) endorsed vitae items.
     * 
     * Example:
     *     head[0x1a2b3c][1]:
     *         hash of vitae data of start node of 0x1a2b3c's hashlist of endorsed vitae items.
     */
    mapping(address => mapping(uint8 => bytes32)) head;
    /*
     * tail [Addr] [Endorsed]
     *
     * similar to head, but refers to end of hashlists.
     */
    mapping(address => mapping(uint8 => bytes32)) tail;
    /*
     * records
     *
     * hashmap of all nodes that form hashlists
     */
    mapping(bytes32 => node) records;

    /*
     * employee
     * 
     * hashmap from an employee user's address to its registered name.
     * bytes32 is used to limit string size.
     */
    mapping(address => bytes32) employee;
    /*
     * institution
     *
     * similar to employee, but refers to institutions.
     */
    mapping(address => bytes32) institution;

    /*
     * request(Addr, Post, Start, End)
     *
     * Addr: address of the institution this request is sent.
     * Post: .
     * startTime: see 'vitae'
     * endTime: see 'vitae'
     */
    function request(address institutionAddr, bytes32 positionName, bool academic, uint start, uint end) public returns(bytes32){
        // caller must have registered as employee
        require(isEmployee(msg.sender));
        // target must have registered as institution
        require(isInstitution(institutionAddr));
        require(end >= start);
        bytes32 hash = keccak256(
            institutionAddr,
            msg.sender,
            positionName,
            academic,
            start,
            end
        );
        records[hash] = node({
            prev0:  tail[msg.sender][0],
            prev1:  tail[institutionAddr][0],
            data:
                vitae({
                    employeeAddr: msg.sender,
                    institutionAddr: institutionAddr,
                    positionName: positionName, 
                    academic: academic,
                    startTime: start,
                    endTime: end
                }),
            next0:  0,
            next1:  0
        });

        // employee's pending (=not endorsed) hashlist is empty
        if (head[msg.sender][0] == 0){
            // this request becomes the first in employee's pending hashlist
            head[msg.sender][0] = hash;
        }

        // employee's pending hashlist is not empty
        if (tail[msg.sender][0] != 0){
            // employee's last node of pending hashlist continues to this request
            records[tail[msg.sender][0]].next0 = hash;
        }

        // this request becomes last node of employee's pending hashlist
        tail[msg.sender][0] = hash;

        // institution's requests (=not endorsed) hashlist is empty
        if (head[institutionAddr][0] == 0){
            // this request becomes the first in institution's requests hashlist
            head[institutionAddr][0] = hash;
        }
        
        // institution's requests hashlist is not empty
        if (tail[institutionAddr][0] != 0){
            // institution's last node of requests hashlist continues to this request
            records[tail[institutionAddr][0]].next1 = hash;
        }
        // this request becomes last node of institution's requests hashlist
        tail[institutionAddr][0] = hash;
        return hash;
    }
    
    /*
     * endorse(hash)
     *
     * hash: key to a node, also the hash of vitae item that node stores
     *
     * remove the node that hash refers to, from:
     *     1.  employee's pending hashlist
     *     2.  institution's requests hashlist
     * add the node to:
     *     1.  employee's vitaes (=endorsed) hashlist
     *     2.  institution's endorsed hashlist
     */
    function endorse(bytes32 hash) public{

        // message sender must be the institution of this vitae item
        require(msg.sender == records[hash].data.institutionAddr);
        address employeeAddr = records[hash].data.employeeAddr;

        // temp0 == key to previous node of employee's pending hashlist (relative to this node)
        bytes32 temp0 = records[hash].prev0;
        // temp1 == key to previous node of institution's requests hashlist (relative to this node)
        bytes32 temp1 = records[hash].prev1;
        // temp2 == key to next node of employee's pending hashlist (relative to this node)
        bytes32 temp2 = records[hash].next0;
        // temp3 == key to next node of institution's requests hashlist (relative to this node)
        bytes32 temp3 = records[hash].next1;

        // this node is (not) first node of employee's pending hashlist
        if (temp0 == 0){
            head[employeeAddr][0] = temp2;
        }
        else{
            records[temp0].next0 = temp2;
        }

        // this node is (not) first node of institution's requests hashlist
        if (temp1 == 0){
            head[msg.sender][0] = temp3;
        }
        else{
            records[temp1].next1 = temp3;
        }

        // this node is (not) last node of employee's pending hashlist
        if (temp2 == 0){
            tail[employeeAddr][0] = temp0;
        }
        else{
            records[temp2].prev0 = temp0;
        }

        // this node is (not) last node of institution's requests hashlist
        if (temp3 == 0){
            tail[msg.sender][0] = temp1;
        }
        else{
            records[temp3].prev1 = temp1;
        }

        // similar to request(), add this node to employee's and institution's endorsed hashlist
        if (head[employeeAddr][1] == 0){
            head[employeeAddr][1] = hash;
        }
        if (head[msg.sender][1] == 0){
            head[msg.sender][1] = hash;
        }
        if (tail[employeeAddr][1] != 0){
            records[tail[employeeAddr][1]].next0 = hash;
        }
        tail[employeeAddr][1] = hash;
	records[hash].next0 = 0x0;
        if (tail[msg.sender][1] != 0){
            records[tail[msg.sender][1]].next1 = hash;
        }
        tail[msg.sender][1] = hash;
	records[hash].next1 = 0x0;
    }
    
    function registerEmployee(bytes32 name) public{
        require(!isEmployee(msg.sender));
        employee[msg.sender] = name;
    }
    
    /*
     * isEmployee(Addr)
     *
     * Addr: address of any user
     *
     * returns:
     *     false: user Addr has not registered as employee.
     *     true: otherwise.
     */
    function isEmployee(address addr) public constant returns (bool){
        return (employee[addr] != 0);
    }
    
    function registerInstitution(bytes32 name) public{
        require(!isInstitution(msg.sender));
        institution[msg.sender] = name;
    }
    
    /*
     * isInstitution(Addr)
     *
     * Addr: address of any user
     *
     * returns:
     *     false: user Addr has not registered as institution.
     *     true: otherwise.
     */
    function isInstitution(address addr) public constant returns (bool){
        return (institution[addr] != 0);
    }
    
    /*
     * getNextPending(Hash, Addr)
     *
     * Hash: 0x0, or key to a node on user Addr's pending hashlist.
     * Addr: address of an employee user.
     *
     * returns:
     *     key to first node of Addr's pending hashlist: Hash == 0; or
     *     key to next node of Addr's pending hashlist, relative to Hash: otherwise.
     */
    function getNextPending(bytes32 hash, address addr) public constant returns (bytes32){
        if (hash == 0){
            return head[addr][0];
        }
        else{
            return records[hash].next0;
        }
    }
    
    /*
     * getNextRequest(Hash, Addr)
     *
     * similar to getNextPending(), but for keys to nodes on institution's request hashlist.
     */
    function getNextRequest(bytes32 hash, address addr) public constant returns (bytes32){
        if (hash == 0){
            return head[addr][0];
        }
        else{
            return records[hash].next1;
        }
    }
    
    /*
     * getNextVitae(Hash, Addr)
     *
     * similar to getNextPending(), but for keys to nodes on vitaes hashlist.
     */
    function getNextVitae(bytes32 hash, address addr) public constant returns (bytes32){
        if (hash == 0){
            return head[addr][1];
        }
        else{
            return records[hash].next0;
        }
    }

    /*
     * getNextEndorsed(Hash, Addr)
     *
     * similar to getNextPending(), but for keys to nodes on institution's endorsed hashlist.
     */
    function getNextEndorsed(bytes32 hash, address addr) public constant returns (bytes32){
        if (hash == 0){
            return head[addr][1];
        }
        else{
            return records[hash].next1;
        }
    }
   
    // getters for vitae struct 
    function getEmployee(bytes32 hash) public constant returns (bytes32){
        return employee[records[hash].data.employeeAddr];
    }
    
    function getInstitution(bytes32 hash) public constant returns (bytes32){
        return institution[records[hash].data.institutionAddr];
    }
    
    function getPosition(bytes32 hash) public constant returns (bytes32){
        return records[hash].data.positionName;
    }
    
    function getStartTime(bytes32 hash) public constant returns (uint){
        return records[hash].data.startTime;
    }
    
    function getEndTime(bytes32 hash) public constant returns (uint){
        return records[hash].data.endTime;
    }
}
