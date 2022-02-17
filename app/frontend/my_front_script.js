
// ######################## VUE ######################## //
var VUEAPP = Vue.createApp({
	data(){ 
		return {
			myInput1Value : 123,
			select1List   : ['cat', 'dog', 'zebra', 'elephant'],
			chosenSelect1 : 'dog',
			myObj : {'key1':'val1', 'key2':'val2'},
			mycheckboxEnabled : 123,
			someInputValue : 'myInput1Value',
			resultsHtml : '',
			// placeholders
			WS_is_connected : false,
			rocketWasStartedInBack : false,
		};
	},
	watch:{ 
		myObj: {
			deep: true,
			handler: function (newVal, oldVal) {
				console.log('my object changed:', myObj);
			},
		},
		myValue(newVal, oldVal){
			console.log('my-value changed:', newVal);
		},
	},
	methods:{  
		formdata(){
			return helpers.formToJson(this.$refs['mainForm']);
		},	
		sendWsButtonClicked(){
			this.sendToBack( 'my_form_send_button', this.formdata() );
		},	
		buttonStartRocket() {
			this.sendToBack( 'start_my_rocket', {exampleKey: 'exampleValue'} );
		},

		writeToResults(txt, withPrefix=true, isReceived=true){
			let prefix = withPrefix ? '<span class="resultPrefix">● [Frontend]' + (isReceived? ' (Received from backend)':'')+'</span> ' : '';
			txt = prefix + txt;
			if (typeof this.resultsArr==='undefined'){
				this.resultsArr = [];
			}
			this.resultsArr.push(`<div>${txt}</div>`);
			this.resultsArr = helpers.arrayPart(this.resultsArr, 300, 'end'); //show only first 300 lines
			this.resultsHtml = this.resultsArr.slice().join('');
		},
		clearResults(event){
			event.preventDefault();
			this.resultsArr=[];
			document.querySelector("#results_area").innerHTML="";
		},

		WS_CONNECTION_STATE(connected_or_disconnected){
			this.WS_is_connected = connected_or_disconnected; 
		},
		
		receivedCallback(msg){ 
			try
			{
				let receivedObject= JSON.parse(msg);
				let action = receivedObject.act_name;
				let data = receivedObject.act_data;
				if (action == 'text_message') {
					// do whatever you want with data
				} else if (action == 'rocket_start_action') {
					this.rocketWasStartedInBack = true;
				}
				this.writeToResults(msg, true, true);
			}
			catch(ex){
				this.writeToResults(" ! ! ! Exception while parsing received message " + msg + "\n\t(Exception: "+ex.toString()+")", true, false);
			}
		},

		sendToBack(myActionName, dataTosend){ 
			let stringified = JSON.stringify( {actionName: myActionName, data:dataTosend} );
			WsContainer.send( stringified ) ;
			VUEAPP.writeToResults("Send to backend: " + stringified, true, false);
		}
	},
}).mount('#vue_app');
// ######################## END ######################## //







// ######################## WS ######################## //
function Ws_Create_Connection()
{
	const url = 'ws://127.0.0.1:'+window['GLOBAL_WSS_PORT'];
	const connection = new WebSocket(url); 
	connection.onopen = () => {
		VUEAPP.writeToResults("WS connection started", true, false);
		VUEAPP.sendToBack('ws_open_action_name', 'Hey, handshake, websocket was opened here, in frontend');
		VUEAPP.WS_CONNECTION_STATE(true);
	}
	connection.onclose = () => {
		VUEAPP.writeToResults("WS connection was closed", true, false);
		VUEAPP.WS_CONNECTION_STATE(false);
	}
	connection.onerror = (error) => {
		VUEAPP.writeToResults("WS connection error:"+JSON.stringify(error), true, false);
		connection.close();
	}
	connection.onmessage = (e) => {
		VUEAPP.receivedCallback(e.data);
	}
	return connection;
}

var WsContainer;
function recreateWs(autoReconnectInterval)
{
	if (!WsContainer) {
		WsContainer=Ws_Create_Connection();
	}
	setInterval(function(){ 
		if(WsContainer.readyState!=1){
			VUEAPP.receivedCallback("Recreate WS connection", true, false);
			WsContainer.close();
			WsContainer=Ws_Create_Connection();
		}
	}, autoReconnectInterval );
}
recreateWs(2000);
// ######################## END ######################## //





// ######################## LIBRARY ######################## //
const helpers = {

	// shame of JS, but there doesnt exist any equivalent native function
	formToJson(FormElement){    
		let formDataEntries = new FormData(FormElement).entries();
		const handleChild = function (obj,keysArr,value){
			let firstK = keysArr.shift();
			firstK=firstK.replace(']','');
			if (keysArr.length==0){
				if (firstK=='') {
					if (!Array.isArray(obj)) obj=[];
					obj.push(value);
				}
				else obj[firstK] = value; 
			} else {
				if (firstK=='') obj.push(value); 
				else {
					if ( ! ( firstK in obj) ) obj[firstK]={};
					obj[firstK] = handleChild(obj[firstK],keysArr,value);
				}
			}
			return obj;
		};
		let result = {};
		for (const [key, value]  of formDataEntries )
			result= handleChild(result, key.split(/\[/), value); 
		return result;
	},

	arrayPart(array_, amount_, from)
	{
		var from = from || 'start'; //start|end
		let count = array_.length;
		return count<=amount_ ? array_ :  ( from=='start' ? array_.slice(0, amount_) :  array_.slice(-amount_) );
	}
};
// ######################## END ######################## //
