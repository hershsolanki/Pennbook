var keyvaluestore = require('../models/keyvaluestore.js');
var async = require('async');

var users2 = new keyvaluestore('users2');
var posts = new keyvaluestore('posts');
var friends = new keyvaluestore('friends');
var comments = new keyvaluestore('comments');
var chat = new keyvaluestore('chat');

users2.init(function(err, data) {
});
posts.init(function(err, data) {
});
friends.init(function(err, data) {
});
comments.init(function(err, data) {
});
chat.init(function(err, data) {
});

/*
 * The function below is an example of a database method. Whenever you need to
 * access your database, you should define a function (myDB_addUser,
 * myDB_getPassword, ...) and call that function from your routes - don't just
 * call DynamoDB directly! This makes it much easier to make changes to your
 * database schema.
 */

// helper function to sort posts by date (most recent first)
var sortPosts = function(store) {
	var newStore = [];

	newStore = store.sort(function(a, b) {
		return parseFloat(a.key) - parseFloat(b.key);
	});
	return newStore;
};

//get chat data from db
var myDB_getChat = function(chatID, route_callbck) {
	chat.get(chatID, function(err, data) {
		if (err) {
			route_callbck(null, "Not found: " + err);
		} else if (data === null) {
			route_callbck(null, null);
		} else {
			
			var parse = JSON.parse(data[0].value);
			var user = parse.user;
			var comment = parse.comment;
			
		var send = JSON.stringify({
			user: user,
			comment: comment
		});
		
		route_callbck(send, null);
		}
	});
};


//add a chat channel between two people and create an empty comments table table for the new chat
var createChatChannel = function(user1, user2, route_callbck) {
	var storeComment = JSON.stringify({
		user : "",
		comment: ""
	})
	var keyName = user1 + "-" + user2;
		chat.put(keyName, storeComment, function(err, data) {
			if (err) {
				route_callbck(null, err);
			} else {
				route_callbck(data, null);
			}	
		});
		
		var keyName2 = user2 + "-" + user1;
		chat.put(keyName2, storeComment, function(err, data) {
			if (err) {
				route_callbck(null, err);
			} else {
				route_callbck(data, null);
			}	
		});

};

//Store chat in the database. What does in get ID?
var createChat = function(user, chatID, comment, route_callbck) {
	chat.get(chatID, function(err, data) { 
		var chatInfo = JSON.parse(data[0].value);
		var inx = JSON.parse(data[0].inx);
		
		var newUser = chatInfo.user + user + "\t";
		var newChat = chatInfo.comment + comment + "\t";
		var store = JSON.stringify({
			user: newUser,
			comment: newChat
		});

		console.log("NEW USERS " + newUser);
		console.log("NEW CHAT " + newChat);

		chat.replace(chatID, JSON.stringify(inx), store, function(err, data2) {
			if (err) {
				console.log("ERROR");
				route_callbck(null, err);
			} else {
				console.log("SUCCESS");
				route_callbck(data2, null);
			}
		});
	});
}

//get chatInfo
var getChatInfo = function(user, route_callbck) {
	chat.get(user, function(err, data) {
		if (err) {
			route_callbck(null, "Invalid" + err);
		} else {
			route_callbck(data, null);
		}
	});
};

//CREATING A LIKE
var createLike = function(user, postID, route_callbck) {
	posts.get(postID, function(err, data) {
		var commentInfo = JSON.parse(data[0].value);
		var inx = JSON.parse(data[0].inx);
		var user1 = commentInfo.user;
		var post1 = commentInfo.post;
		var where1 = commentInfo.where;
		
		var newLiker = commentInfo.liker + user + "\t";
		
		var store = JSON.stringify({
			user : user1,
			post : post1,
			where : where1,
			liker: newLiker
		});

		console.log("NEW LIKE " +  newLiker);

		posts.replace(postID, JSON.stringify(inx), store, function(err, data2) {
			if (err) {
				console.log("ERROR");
				route_callbck(null, err);
			} else {
				console.log("SUCCESS");
				route_callbck(data2, null);
			}
		});
	});
}

//GETTING POSTS
var myDB_getPost = function(postID, route_callbck) {
	posts.get(postID, function(err, data) {
		if (err) {
			route_callbck(null, "Not found: " + err);
		} else if (data === null) {
			route_callbck(null, null);
		} else {
			
			var parse = JSON.parse(data[0].value);
			var user = parse.user;
			var comment = parse.comment;
			var liker = parse.liker;
			
		var send = JSON.stringify({
			user: user,
			comment: comment,
			liker: liker,
		});
		
		route_callbck(send, null);
		}
	});
};

// get post data from db
var myDB_getPosts = function(route_callbck) {
	var postList = [];
	var commentList = [];
	posts.scanKeys(function(err, data) {
		async.each(data, function(post, callbck2) {
			posts.get(post.key, function(err, data) {
				var first = data[0].value;
				var val = JSON.parse(first);
				var newPost = {
					key : post.key,
					value : val
				};
				postList.push(newPost);

				comments.get(post.key, function(err2, data2) {
					var first = data2[0].value;
					var val = JSON.parse(first);
					var newComment = {
						key : post.key,
						value : val
					};
					commentList.push(newComment);

					callbck2();
				});

			});
		}, function(err) {
			var send = JSON.stringify({
				posts: sortPosts(postList),
				comments: sortPosts(commentList)
			});
			route_callbck(send, null);
		});
	});
};

// find user 
var myDB_lookup = function(username, password, route_callbck) {
	users2.get(username, function(err, data) {
		if (err) {
			route_callbck(null, "Not found: " + err);
		} else if (data === null) {
			route_callbck(null, null);
		} else {
			var user_password1 = data[0].value.split(",");
			var user_password2 = user_password1[0];
			var real_password = user_password2.split(":")[1];
			var check = JSON.stringify(password);
			if (real_password == check) {
				route_callbck("yes", null);
			} else {
				route_callbck("no", null);
			}
		}
	});
};

// add a user 
var createAccount = function(user1, pass1, first1, last1, email1, affiliation1, interests1, bday1, status1, active1, route_callbck) {
	users2.get(user1, function(err, data) {
		if (err) {
			route_callbck(null, "Invalid" + err);
		} else if (data === null) {
			var storeUser = JSON.stringify({
				password : pass1,
				firstname : first1,
				lastname: last1,
				email: email1,
				affiliation: affiliation1,
				interests: interests1,
				birthday: bday1,
				status: status1,
				active: active1
			});
			var create = function(adding) {
				adding.put(user1, storeUser, function(data, err) {
				});
			};
			create(users2);
			route_callbck("done", null);
		} else {
			route_callbck("not", null);
		}
	});
};

//ADDED LIKER HERE
// add a post and create an empty comment table for the new post
var createPost = function(user1, time1, post1, where1, route_callbck) {
	var storeRest = JSON.stringify({
		user : user1,
		post : post1,
		where : where1,
		liker: ""
	});
	var storeComment = JSON.stringify({
		user : "",
		comment: "",
		liker: ""
	})
	posts.put(time1, storeRest, function(err, data) {
		comments.put(time1, storeComment, function(err2, data2) {
			if (err) {
				route_callbck(null, err);
			} else {
				route_callbck(data, null);
			}	
		});
	});
};


var createComment = function(user, postID, comment, route_callbck) {
	comments.get(postID, function(err, data) {
		var commentInfo = JSON.parse(data[0].value);
		var inx = JSON.parse(data[0].inx);

		var newUser = commentInfo.user + user + "\t";
		var newComment = commentInfo.comment + comment + "\t";
		var store = JSON.stringify({
			user: newUser,
			comment: newComment
		});

		console.log("NEW USERS " + newUser);
		console.log("NEW COMMENTS " + newComment);

		comments.replace(postID, JSON.stringify(inx), store, function(err, data2) {
			if (err) {
				console.log("ERROR");
				route_callbck(null, err);
			} else {
				console.log("SUCCESS");
				route_callbck(data2, null);
			}
		});
	});
}

// delete marker and restaurant from database
var deleteRestaurant = function(name, route_callbck) {
	restaurants.get(name, function(err, data) {
		if (err) {
			route_callbck("error", err);
		} else if (data === null) {
			route_callbck(null, null);
		} else {
			var index = JSON.parse(data[0].inx);
			restaurants.remove(name, JSON.stringify(index),
					function(err, data) {
						if (err) {
							route_callbck();
						} else if (data) {
							route_callbck(data, null);
						}
					});
		}
	});
};

// get user profile info from database
var getUserInfo = function(username, route_callbck) {
	users2.get(username, function(err, data) {
		if (err) {
			route_callbck(null, "Invalid" + err);
		} else {
			route_callbck(data, null);
		}
	});
};

var getProfilePosts = function(username, route_callbck) {
	var postList = [];
	var commentList = [];
	posts.scanKeys(function(err, data) {
		async.each(data, function(post, callbck2) {
			posts.get(post.key, function(err, data) {
				var first = data[0].value;
				var val = JSON.parse(first);
				var newPost = {
					key : post.key,
					value : val
				};
				if (val.where === username) {
					postList.push(newPost);

					comments.get(post.key, function(err2, data2) {
					var first = data2[0].value;
					var val = JSON.parse(first);
					var newComment = {
						key : post.key,
						value : val
					};
					
					commentList.push(newComment);

					callbck2();
					});
				} else {
					callbck2();
				}
			});
		}, function(err) {
			var send = JSON.stringify({
				posts: sortPosts(postList),
				comments: sortPosts(commentList)
			});
			route_callbck(send, null);
		});
	});
};

//adds friend2 to friend1's list of friends
var addFriend = function(friend1, friend2, route_callbck) {
	friends.get(friend1, function(err, data1) {
		if (err) {
			route_callbck(null, "Invalid" + err);
		} else if (data1 === null) {
			var storeRest = JSON.stringify({
				friends: friend2 + "\t"
			});
			friends.put(friend1, storeRest, function(err, data) {
				if (err) {
					route_callbck(null, err);
				} else {
					route_callbck(data, null);
				}
			});
		} else {
			var index = JSON.parse(data1[0].inx);
			var currentFriends = JSON.parse(data1[0].value);
			var storeRest = JSON.stringify({
				friends: currentFriends.friends + friend2 + "\t"
			});

			friends.replace(friend1, JSON.stringify(index), storeRest, function(err, data2) {
				if (err) {
					route_callbck(null, err);
				} else {
					route_callbck(data2, null);
				}
			});	
		}
	});
};

//get all friends of user
var getFriends = function(user, route_callbck) {
	friends.get(user, function(err, data) {
		if (err) {
			route_callbck(null, "Invalid" + err);
		} else {
			route_callbck(data, null);
		}
	});
};

//get friends of same affiliation
var getAffiliatedFriends = function(user, friend, route_callbck) {
	users2.get(user, function(err, data) {
		var info = JSON.stringify(data);
		var parseData = JSON.parse(info);
		var userInfo = JSON.parse(parseData[0].value);
		var affiliation = userInfo.affiliation;

		friends.get(friend, function(err, data2) {
			if (data != null) {
				var info = JSON.stringify(data2);
				var parseData = JSON.parse(info);
				var friends = JSON.parse(parseData[0].value);
				var friendsList = friends.friends.split('\t');

				var affiliatedfriends = [];

				async.each(friendsList, function(friend, callbck2) {
					if (friend != "") {
						users2.get(friend, function(err, data3) {
							var info = JSON.stringify(data3);
							var parseData = JSON.parse(info);
							var userInfo = JSON.parse(parseData[0].value);

							if (userInfo.affiliation == affiliation) {
								affiliatedfriends.push(friend);
							}

							callbck2();
						});
					} else {
						callbck2();
					}
				}, function(err) {
					var data = JSON.stringify({
						friends: affiliatedfriends
					});
					route_callbck(data, null);
				});
			} else {
				route_callbck(null, null);
			}
		});
	});
};

//return a list of user's online friends and a list of user's offline friends
var getOnlineFriends = function(user, route_callbck) {
	friends.get(user, function(err, data) {
		if (err) {
			route_callbck(null, "Invalid" + err);
		} else {
			if (data != null) {
				var info = JSON.stringify(data);
				var parseData = JSON.parse(info);
				var friends = JSON.parse(parseData[0].value);
				var friendsList = friends.friends.split('\t');

				var online = [];
				var offline = [];

				async.each(friendsList, function(friend, callbck2) {
					if (friend != "") {
						users2.get(friend, function(err, data2) {
							var info2 = JSON.stringify(data2);
							var parseData = JSON.parse(info2);
							var userInfo = JSON.parse(parseData[0].value);

							if (userInfo.active) {
								online.push(friend);
							} else {
								offline.push(friend);
							}
							callbck2();
						});
					} else {
						callbck2();
					}
				}, function(err) {
					var data = {
						online: online,
						offline: offline
					}
					route_callbck(data, null);
				});
			} else {
				route_callbck(null, null);
			}
		}
	});
};

var updateProfile = function(user, firstname, lastname, email, affiliation, interests, birthday, status, active, route_callbck) {
	users2.get(user, function(err, data) {
		if (err) {
			route_callbck(null, "Invalid" + err);
		} else {
			var inx = JSON.parse(data[0].inx);
			var userInfo = JSON.parse(data[0].value);
			var password = userInfo.password;

			var storeUser = JSON.stringify({
				password : password,
				firstname : firstname,
				lastname: lastname,
				email: email,
				affiliation: affiliation,
				interests: interests,
				birthday: birthday,
				status: status,
				active: active
			});

			users2.replace(user, JSON.stringify(inx), storeUser, function(err, data2) {
				if (err) {
					route_callbck(null, err);
				} else {
					route_callbck(data2, null);
				}
			});	
		}
	});
};

var search = function(route_callbck) {
	users2.scanKeys(function(err, data) {
		var users = new Array();
		async.each(data, function(user, callbck2) {
			users.push(user.key);
			callbck2();
		}, function(err) {
			var send = JSON.stringify({
				users: users
			});
			route_callbck(send, null);
		});
	});
};



/*
 * We define an object with one field for each method. For instance, below we
 * have a 'lookup' field, which is set to the myDB_lookup function. In
 * routes.js, we can then invoke db.lookup(...), and that call will be routed to
 * myDB_lookup(...).
 */

var database = {
	lookup : myDB_lookup,
	createAccount : createAccount,
	myDB_getPosts : myDB_getPosts,
	createPost: createPost,
	deleteRestaurant : deleteRestaurant,
	getUserInfo : getUserInfo,
	getProfilePosts : getProfilePosts,
	addFriend: addFriend,
	getFriends: getFriends,
	getAffiliatedFriends: getAffiliatedFriends,
	updateProfile: updateProfile,
	getOnlineFriends: getOnlineFriends,
	createComment: createComment,
	search: search,
	myDB_getChat: myDB_getChat,
	createChatChannel: createChatChannel,
	createChat: createChat,
	getChatInfo: getChatInfo,
	createLike: createLike,
	myDB_getPost: myDB_getPost
};

module.exports = database;
