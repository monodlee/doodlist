var express = require('express');
var http = require('http');
var socket = require('socket.io');
var db = require('./database');
var app = express();
var server = http.createServer(app);
var io = socket.listen(server);
var drawing_data = [];
var user_drawings;

io.sockets.on('connection', function(socket){
	socket.emit('refresh', drawing_data);
	socket.on('draw', function(point){
		io.sockets.emit('draw', point);
		drawing_data.push(point);
	});

	socket.on('sign up', function(user_data){
		user_data.friends = [];
		db.createUser(user_data.username, user_data, function(err, reply){
			if(reply){
				socket.emit('login', user_data);
			}
		});
	});

	socket.on('login', function(user_data){
		db.validateUser(user_data.username, user_data.password, function(err, reply){
			if(reply){
				db.getUser(user_data.username, function(err, reply){
					if(reply){
						user_drawings = [];
						db.getDrawingsbyUser(user_data.username, function(err, reply){
							if(reply.length>0){
								var i;
								for(i=0;i<reply.length-1;i++){
									db.getDrawingbyID(reply[i], add_user_drawing);
								}
								db.getDrawingbyID(reply[reply.length-1], function(err, reply){
									user_drawings.push(reply);
									user_drawings.sort(function(a,b){return a.timestamp-b.timestamp;});
									socket.emit('store drawings', user_drawings);
								});
							}
						});
						socket.emit('login', reply);
					}
				});
			}
			else{
				socket.emit('invalid login');
			}
		});
	});

	socket.on('fb login', function(userId){
		db.getUser(userId, function(err, reply){
			if(reply !== null){
				user_drawings = [];
				db.getDrawingsbyUser(userId, function(err, reply){
					if(reply.length>0){
						var i;
						for(i=0;i<reply.length-1;i++){
							db.getDrawingbyID(reply[i], add_user_drawing);
						}
						db.getDrawingbyID(reply[reply.length-1], function(err, reply){
							user_drawings.push(reply);
							user_drawings.sort(function(a,b){return a.timestamp-b.timestamp;});
							socket.emit('store drawings', user_drawings);
						});
					}
				});
				socket.emit('login', reply);
			}
			else{
				db.createUser(userId, {username: userId, friends: []}, function(err, reply){
					if(reply){
						socket.emit('login', {username: userId, friends: []});
					}
				});
			}
		});
	});
	socket.on('undo', function(){
		socket.broadcast.emit('undo', socket.id);
		var i = drawing_data.length - 1;
		while(i >= 0 && (drawing_data[i].x !== undefined || drawing_data[i].id != socket.id)){//look for the "endpoint"
			i--;
		}

		if(i >= 0 && drawing_data[i].x === undefined){ //if current data point is an "endpoint"
			drawing_data.splice(i,1);							//delete it
			i--;
		}

		while(i >= 0 && (drawing_data[i].x !== undefined || drawing_data[i].id != socket.id)){//delete all related points until next "endpoint"
			if(drawing_data[i].id == socket.id){
				drawing_data.splice(i,1);
			}
			i--;
		}
	});

	socket.on('clear', function(){
		socket.broadcast.emit('clear');
		drawing_data = [];
	});
	
	socket.on('save', function(save_data){
		db.createDrawing(save_data, function(err, reply){
			if(reply){
				console.log('save success');
				socket.emit('store drawings', [save_data]);
			}
		});
	});
	
	socket.on('load', function(dwid){
		db.getDrawingByID(dwid, function(err, reply){
			if(reply){
				console.log('load success');
				socket.broadcast.emit('refresh', reply.data);
			}
			else{
				console.log('load failure');
			}
		});
	});
	
	socket.on('delete', function(dwid){
		db.deleteDrawing(dwid, function(err, reply){
			if(reply){
				console.log('delete success');
			} else{
				console.log('delete fail');
			}
		});
	});

});

app.get('/', function(req, res) {
	console.log(__dirname + '/index.html');
	res.sendfile(__dirname + '/index.html');
});

app.get('/socket.io/lib/socket.io.js', function(req, res) {
	console.log(__dirname + req.path);
	res.sendfile(__dirname + '/node_modules' + req.path);
});

app.get('/images/*', function(req, res){
	console.log(__dirname + req.path);
	res.sendfile(__dirname + req.path);
});

respond_to_get('/js/jquery-1.9.0.js');
respond_to_get('/js/jquery-ui-1.10.0.custom.min.js');
respond_to_get('/jcanvas.min.js');
respond_to_get('/jcanvasboard.js');
respond_to_get('/css/smoothness/jquery-ui-1.10.0.custom.min.css');
respond_to_get('/css/style.css');
respond_to_get('/fonts/Flux_Architect_Regular-webfont.eot');
respond_to_get('/fonts/Flux_Architect_Regular-webfont.eot?#iefix');
respond_to_get('/fonts/Flux_Architect_Regular-webfont.woff');
respond_to_get('/fonts/Flux_Architect_Regular-webfont.ttf');
respond_to_get('/fonts/Flux_Architect_Regular-webfont.svg#FluxRegular');
respond_to_get('/css/smoothness/images/ui-icons_222222_256x240.png');
respond_to_get('/channel.html');

var port = process.env.PORT || 3000;
server.listen(port);

function respond_to_get(path){
	app.get(path, function(req, res) {
		console.log(__dirname + req.path);
		res.sendfile(__dirname + req.path);
	});
}

function add_user_drawing(err, reply){
	user_drawings.push(reply);
}