'use strict';
const hat = require('hat');

const mongoose = require('./db'),
      userModel = require('./user');
    
const schema = mongoose.Schema;
const user = new userModel.UserActions();

const communityObject =
{
    name : {type:String, required:true, unique:true },
    title : {type: String, required:true},
    description : String,
    logo : String,
    creator: {type: schema.Types.ObjectId, ref: 'Users', require: true},
    inv_token : {type: String, unique:true, required:true},
    user_admin: [{type: schema.Types.ObjectId, ref: 'Users', require: true }],
    user_moderator: [{type: schema.Types.ObjectId, ref: 'Users' }],
    users: [{type: schema.Types.ObjectId, ref: 'Users'}],
    creationDate: {type: Date, default: Date.now()},
    privacy: {type:String, enum:['PRIVATE','PUBLIC','OPEN'], default: 'OPEN', require: true},
    requests: [{type: schema.Types.ObjectId, ref: 'Users'}],
    secret: {type: String, require: true, unique:true}
    
};

const communitySchema = new schema(communityObject,{collection : "Communities"});

const community = mongoose.model('Community',communitySchema);

class CommunityActions
{  
    registerCommunity(newCommunity, cb)
    {
        this.getCommunity({name:newCommunity.name},(ok,msgCommunity)=>
        {
            if(ok) return cb(false, {error:"Community already exists"});            
            console.log("NEWCOMMUNITY>>",newCommunity);           
            
            user.getUser({_id:newCommunity.creator}, (ok,msg)=>
            {
                if(ok)
                {
                    User.getUsersIds(newCommunity.user_admin,(admins)=>
                    {
                        newCommunity.user_admin = admins;
                        newCommunity.user_admin.push(newCommunity.creator);
                        
                        user.getUsersIds(newCommunity.user_moderator,(moderators)=>
                        {
                            newCommunity.user_moderator = moderators;
                            newCommunity.user_moderator.push(newCommunity.creator); 
                            
                            community.create(newCommunity,(err)=>
                            {
                                if(err) 
                                    return cb(false,{ error:"Couln't register new community: "+err});
                                else return cb(true,{message: "Community registered! Yay!"});
                            });
                            
                        });                        
                        
                    });                    
                }else return cb(false,msg);                    
            });        
        });        
    }
        
    generateCommunityToken(data)
    {
        let token = hat();
        return data+token.slice(0,4);
    }
    
    generateCommunitySecret(data)
    {
        let abc = "abcdefghijklmnopqrstuvwxyz";        
        var token = hat();      
        for (l in data) 
           token+= abc.indexOf(data[l])   
        
        return token;
    }

    registerUser(query,update,cb)
    {
        community.update(query,update,(err,updated)=>
        {
            if(err) return cb(false, {error:err});
            return cb(true,{message:"User added"});
        });
    }

    getCommunity(query, cb)
    {
        community.findOne(query, (err, community) =>
        {
            if(err) return cb(false, {error: err});
            if(!community)  return cb(false, {error: "The community doesn't exists"});
                     
            return cb(true, community);
        });
    }
    
    getCommunities(query, cb)
    {
        community.find(query, (err, communities) =>
        {
            if(err) return cb(false, {error: err});
            if(!communities) return cb(false, {message: "Not communities found"})
        });        
    }

    registerRequest(query,update,cb)
    {
        community.update(query,update,(err,updated)=>
        {
            if(err) return cb(false, {error:err});
            return cb(true, {message:"User added"});
        });
    }

    updateCommunity(query, cb)  
    {
        community.update(query, (err) => 
        {
            if(err) return cb(false, { error: err });
            return cb(true, { message: "Community updated" });
        })
    }

    deleteCommunity(query, cb) 
    {
        community.remove(query, (err, remove) => 
        {
            (err) ? cb(false, { error: err} ) : cb(true, { message: "Community deleted" });
        })
    }

    getUsers(query, cb)
    {
        community.aggregate([{$match: query},{$lookup: {from: "Users", localField: "users", foreignField: "_id", as:"communityUsers"}}],(err, communityUsers) =>
        {
            if (err) return cb(false, { error: err })
            if (!communityUsers) return cb(flase, {message: "There are not users"})
            return cb(true,communityUsers)
        });

    }
}

module.exports = {CommunityActions,community};
