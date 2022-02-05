
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

			isAjaxSendDisabled : true,
			WS_Connected : false,
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
		frmdata(){
			return helpers.formItemsToJson(this.$refs['mainForm']);
		},
		sendWsButtonClicked(){
			WS_MESSAGE_SEND( 'my_send_button_event', {animal: this.chosenSelect1, inputVal1: this.myInput1Value} );
		},		
		sendAjaxButtonClicked(){
			console.log("AJAX-SEND not implemented");
		},
		
		writeToResults(txt){
			console.log(txt);
			let box =document.querySelector("#results_area"); 
			if (typeof this.resultsArr==='undefined'){
				this.resultsArr = [];
			}
			this.resultsArr.push(`<div>${txt}</div>`);
			this.resultsArr = helpers.arrayPart(this.resultsArr, 300, 'end'); //show only first 300 lines
			this.resultsHtml = this.resultsArr.slice().reverse().join('');
		},
		clearResults(event){
			event.preventDefault();
			this.resultsArr=[];
			document.querySelector("#results_area").innerHTML="";
		},

		WS_CONNECTION_STATE(connected_or_disconnected){
			this.WS_Connected = connected_or_disconnected; 
		},
		
		WsMsgCallback(msg, receive=true){ 
			try
			{
				let msgFinal='';
				try      { msgFinal = JSON.parse(msg); }
				catch(ex){ msgFinal = msg; }
				let prefix = '<span class="resultPrefix">● [Frontend]' + (receive? ' (Received from backend)':'')+'</span> ';
				this.writeToResults(prefix + msgFinal);
			}
			catch(ex){
				this.writeToResults(" ! ! ! [Frontend: Exception while parsing received message] " + msg + "\n\t(Exception: "+ex.toString()+")");
			}
		},
	},
}).mount('#vue_app');
// ######################## END ######################## //







// ######################## WS ######################## //
function Ws_Create_Connection()
{
	const url = 'ws://127.0.0.1:'+window['GLOBAL_WSS_PORT'];
	const connection = new WebSocket(url); 
	connection.onopen = () => {
		WS_MESSAGE_RECEIVED('WS-OPEN signal', false) ;
		WS_MESSAGE_SEND('ws_open_action_name', 'WS Initialization signal - sending to backend');
		VUEAPP.WS_CONNECTION_STATE(true);
	}
	connection.onclose = () => {
		WS_MESSAGE_RECEIVED('WS closed', false);
		VUEAPP.WS_CONNECTION_STATE(false);
	}
	connection.onerror = (error) => {
		WS_MESSAGE_RECEIVED(`WS error:` + JSON.stringify(error));
		connection.close();
	}
	connection.onmessage = (e) => {
		WS_MESSAGE_RECEIVED(e.data);
	}
	return connection;
} 

function WS_MESSAGE_SEND(myActionName, dataTosend){ 
	let stringified = JSON.stringify( {actionName: myActionName, data:dataTosend} );
	WsContainer.send( stringified ) ;
	VUEAPP.WsMsgCallback("Send to backend: " + stringified, false);
}
function WS_MESSAGE_RECEIVED(what, isReceivedMessage = true){
	VUEAPP.WsMsgCallback(what, isReceivedMessage);
}

var WsContainer;
function recreateWs(autoReconnectInterval)
{
	if (!WsContainer) {
		WsContainer=Ws_Create_Connection();
	}
	setInterval(function(){ 
		if(WsContainer.readyState!=1){
			VUEAPP.WsMsgCallback("Recreate WS connection",false);
			WsContainer.close();
			WsContainer=Ws_Create_Connection();
		}
	}, autoReconnectInterval );
}
recreateWs(2000);
// ######################## END ######################## //





// ######################## LIBRARY ######################## //
const helpers = {
	formItemsToJson(FormElement){    
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
			} 
			else{
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
