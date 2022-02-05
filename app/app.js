// ############################################################ //
// ########################### START ########################## //
// ############################################################ //

const useAjaxToo = false;

const path      = require("path");
const fs        = require('fs');
const express   = require('express');
const EJS   	= require('ejs');
const WebSocket = require('ws');
function c(x){ console.log(x); }
// ##########################


const MainApp = {
	wss : null,
	app : null,

	INIT()
	{
		this.init_nodeserver();
		this.init_frontend(); 
		this.init_websocket_server();
		if (useAjaxToo) {
			this.init_ajax_api();
		}
	},

	sendToFront(obj){
		const stringified = JSON.stringify(obj);
		if(this.wss) {
			console.log('[Backend Send]', stringified);
			this.wss.send(stringified);
		}
		else { 
			console.log("Backend WS hasn't received the connection. Can't send msg:", stringified); 
		}
	},

	init_nodeserver()
	{
		this.instanceStarted= false;
		this.Server_Port    = 3456;
		this.Ws_Port  		= this.Server_Port + 1;
		this.Server_Url     = 'http://127.0.0.1:'+this.Server_Port;
	},

	init_frontend()
	{
		this.app = express();
		this.app.set('views', path.join(__dirname, 'frontend'));     // set custom root for view engine
		this.app.set('view engine', 'html'); // set view engine
		this.app.engine('html', EJS.renderFile);

		const self=this;
		const myObject = {
			'a' : 123,
			'b' : 456,
		};
		this.sampleAjaxResponderPage  = '/ajaxResponder';
		this.app.get('/',function(req,res) {
			res.render(__dirname + '/frontend/index.html', {
				tradePage: self.sampleAjaxResponderPage,
				WS_PORT: self.Ws_Port,
				SOME_JSON_DATA: JSON.stringify( myObject ), 
				ajaxurl: self.Server_Url
			});
			//res.sendFile(__dirname + '/index.html');
		});	 

		this.app.use('/frontend',            express.static(path.join(__dirname, 'frontend/')));
		this.app.use('/lib',            express.static(path.join(__dirname, 'lib/')));
		// this.app.use('/favicon.ico', express.static(__dirname + '/front/index.html'));

		let bodyParser = require("body-parser");
		this.app.use(bodyParser.json());
		this.app.use(bodyParser.urlencoded({ extended: true }));

		this.app.listen(this.Server_Port, () => {
			console.log('Webserver running at '+ this.Server_Url);
		});
	},


	init_websocket_server()
	{
		let self = this; 
		this.ws = new WebSocket.Server({ port: this.Ws_Port });
		this.ws.on('connection', W => {
			self.wss = W;
			self.sendToFront('Websocket connection started');
			self.wss.on('message', message => {
				try{
					let respJson = JSON.parse(message); 
					self.parse_received_WSDATA(respJson);
				}
				catch(ex){
					console.log(ex);
				}
			});
			
			self.wss.on('close', function close() {
				console.log('[Backend] WS Disconnect');
			});
			
		});
	},

	parse_received_WSDATA(jsonData){ 
		console.log('[Backend: Received]', jsonData);
	},
 
	init_ajax_api()
	{
		const self = this;
		this.app.post(this.sampleAjaxResponderPage, (req, res) => {
			var params = req.body;  
			console.log("[Backend: POST received]:"+ JSON.stringify(params) );
			res.json(answ);
		});
	},
}


MainApp.INIT();

 
