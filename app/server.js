// ######## imports ########### //
const path      = require('path');
const fs        = require('fs');
const express   = require('express');
const EJS   	= require('ejs');
const WebSocket = require('ws');
const MyProgram   = require ('./backend/my_program.js');
function c(x){ console.log(x); }
// ########################## //


class serverApp  {
	wss = null;
	app = null;
	myProgramInstance = null;

	INIT()
	{
		this.set_node_params();
		this.init_frontend_engine(); 
		this.init_websocket_server();
		this.init_ajax_api();
		this.myProgramInstance = new MyProgram(this);
	}

	set_node_params()
	{
		this.instanceStarted= false;
		this.HostPort_HTTP  = 3456;
		this.HostPort_WS  	= this.HostPort_HTTP + 1;
		this.HostUrl_HTTP   = 'http://127.0.0.1:'+this.HostPort_HTTP;
		this.HostUrl_WS     = 'http://127.0.0.1:'+this.HostPort_WS;
	}

	init_frontend_engine()
	{
		this.app = express();
		this.app.set('views', path.join(__dirname, 'frontend'));     // set custom root for view engine
		this.app.set('view engine', 'html'); // set view engine
		this.app.engine('html', EJS.renderFile);

		const self=this;
		const sampleObject = {
			'a' : 123,
			'b' : 456,
		};
		this.sampleAjaxResponderPage  = '/ajaxResponder';
		this.app.get('/',function(req,res) {
			res.render(__dirname + '/frontend/index.html', {
				WS_PORT: self.HostPort_WS,
				ajaxurl: self.HostUrl_HTTP,
				tradePage: self.sampleAjaxResponderPage,
				SOME_JSON_DATA: JSON.stringify( sampleObject ), 
			});
			//res.sendFile(__dirname + '/index.html');
		});	 

		this.app.use('/frontend',            express.static(path.join(__dirname, 'frontend/')));
		this.app.use('/lib',            express.static(path.join(__dirname, 'lib/')));
		// this.app.use('/favicon.ico', express.static(__dirname + '/front/index.html'));

		let bodyParser = require("body-parser");
		this.app.use(bodyParser.json());
		this.app.use(bodyParser.urlencoded({ extended: true }));

		this.app.listen(this.HostPort_HTTP, () => {
			console.log('web http server running at '+ this.HostUrl_HTTP);
		});
	}


	init_websocket_server()
	{
		this.ws = new WebSocket.Server({ port: this.HostPort_WS });
		this.wss = null;
		const self = this; 
		this.ws.on('connection', W => {
			self.wss = W;
			self.myProgramInstance.connectionEvent('start');
			self.wss.on('message', message => {
				let respJson = JSON.parse(message);
				self.myProgramInstance.connectionEvent('incoming', respJson);
			});
			
			self.wss.on('close', function close() {
				self.myProgramInstance.connectionEvent('close');
			});
			
		});

	}

	sendToFront(objData){
		const stringified = JSON.stringify(objData);
		if(this.wss) {
			this.wss.send(stringified);
		}
		else { 
			console.log("[Backend] WS hasn't received the connection. Can't send msg:", stringified); 
		}
	}

	init_ajax_api()
	{
	 	const self = this;
	 	this.app.post(this.sampleAjaxResponderPage, (req, res) => {
	 		var params = req.body;  
	 		console.log("[Backend] AJAX POST received:"+ JSON.stringify(params) );
	 		res.json({'key1':'Hello from backend, I have an advise - migrate to WS instead of AJAX'});
	 	});
	}
}

(new serverApp()).INIT();

 
