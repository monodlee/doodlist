redis = require('redis');
db = redis.createClient();
module.exports.db = db;

function userExists(user, cb){
	cb = cb || function(){};
	db.hget('users', user, function(err, reply){
		if(reply !== null)
			cb(null, true);
		else cb(null, false);
	});
}

module.exports.userExists = userExists;

module.exports.createUser = function (user, properties, cb) {
	properties = properties || {};
	cb = cb || function(){};
	userExists(user,function(err, reply){
		if (reply === true)
			cb(null, false);
		else {
			db.hset('users', user, JSON.stringify(properties), function(err, reply){
				if (reply === 1)
					cb(null, true);
				else
					cb(null, false);
			});
		}
	});
};

module.exports.updateUser = function (user, properties, cb) {
	properties = properties || {};
	cb = cb || function(){};
	userExists(user,function(err, reply){
		if (reply === false)
			cb(null, false);
		else {
			db.hset('users', user, JSON.stringify(properties), function(err, reply){
				if (reply === 0)
					cb(null, true);
				else
					cb('something odd is happening with updateUser', false);
			});
		}
	});
};
module.exports.deleteUser = function (user, cb) {
	cb = cb || function(){};
	userExists(user,function(err, reply){
		if (reply === false)
			cb(null, false);
		else {
			db.hdel('users', user, function(err, reply){
				if (reply === 1)
					cb(null, true);
				else
					cb(null, false);
			});
		}
	});
};

module.exports.getUser = function (user, cb) {
	cb = cb || function(){};
	db.hget('users', user, function(err, reply){
		cb(null, JSON.parse(reply));
	});
};

module.exports.validateUser = function (user, pwd, cb){
	pwd = pwd || "";
	cb = cb || function(){};
	db.hget('users', user, function(err, reply){
		if( reply !== null){
			if(JSON.parse(reply).password === pwd)
				cb(null, true);
			else
				cb(null, false);
		}
		else
			cb(null, false);
	});

};

module.exports.createDrawing = function(properties, cb){
	properties = properties || {};
	if(properties.user !== undefined && properties.timestamp !== undefined){
		dwid = properties.user + ':' +  properties.timestamp;
		db.hset('drawings', dwid, JSON.stringify(properties), function(err, reply){
			db.sadd( properties.user, dwid, function(){});
			cb(null, true);
		});
	}
	else cb(null, false);
};

module.exports.getDrawingbyID = function(dwid, cb){
	db.hget('drawings', dwid, function(err, reply){
		cb( null, JSON.parse(reply));
	});
};
module.exports.getDrawingsbyUser = function(user, cb){
	db.smembers(user, function(err, reply){
		cb(null, reply);
	});
};

module.exports.deleteDrawing = function(dwid,cb){
		user = dwid.replace(/:.*$/,'');
		console.log('user: '+ user);
		db.srem(user, dwid, function(err, reply){
			if(reply===1)
				db.hdel('drawings', dwid, function(err, reply){
					if(reply===1)
						cb(null, true);
					else
						cb(null, false);
				});
			else
				db.hdel('drawings', dwid);
			cb(null, false);
		});

};








