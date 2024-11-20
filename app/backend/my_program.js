
class MyProgram {
    parent = null; 
    constructor(parentClass){
        this.parent = parentClass;
    }
    
    send(clientId, actionName, data){
        const objData = {act_name:actionName, act_data:data}
        console.log('[Backend: Sends] ' + JSON.stringify(objData));
        this.parent.sendToFront(clientId, objData);
    }
    
    connectionEvent(clientId, eventName, jsonData = undefined) {
        switch(eventName) {
            case 'start':
                console.log('[Backend] Websocket connection is now started');
                this.send(clientId, 'text_message', 'Hello, I am backend, connection was successfully started here too');
                break;
            case 'close':
                console.log('[Backend] WS was closed');
                break;
            default: // for 'incoming'
                console.log('[Backend] WS data received', jsonData);
                this.parse_received_data(clientId, jsonData);
                break;
        }
    }

	parse_received_data(clientId, jsonData){ 
        let actionName = jsonData.actionName;
        let data = jsonData.data;
        if (actionName === 'start_my_rocket') {
            console.log('[Backend] starting my rocker, with data:', data);
            this.send(clientId, 'text_message', 'Your mission was complete, rocket started up!' );
            this.send(clientId, 'rocket_start_action', {fuel_weight: 123} );
        } 
	}
 
}

module.exports = MyProgram;