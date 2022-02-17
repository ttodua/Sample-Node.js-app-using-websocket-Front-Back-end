
class MyProgram {
    parent = null; 
    constructor(parentClass){
        this.parent = parentClass;
    } 
    send(actionName, data){
        const objData = {act_name:actionName, act_data:data}
        console.log('[Backend: Sends] ' + JSON.stringify(objData));
        this.parent.sendToFront(objData);
    }
    
    connectionEvent(eventName, jsonData = undefined) {
        switch(eventName) {
            case 'start':
                console.log('[Backend] Websocket connection is now started');
                this.send( 'text_message', 'Hello, I am backend, connection was successfully started here too');
                break;
            case 'close':
                console.log('[Backend] WS was closed');
                break;
            default: // for 'incoming'
                this.parse_received_data(jsonData);
                break;
        }
    }

	parse_received_data(jsonData){ 
        let actionName = jsonData.actionName;
        let data = jsonData.data;
        console.log('[Backend: Received]', jsonData);
        
        if (actionName === 'start_my_rocket') {
            console.log('[Backend] starting my rocker, with data:', data);
            this.send('text_message', 'Your mission was complete, rocket started up!' );
            this.send('rocket_start_action', {fuel_weight: 123} );
        } 
	}
 
}

module.exports = MyProgram;