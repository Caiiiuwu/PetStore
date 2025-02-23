import { REST } from "@hawkstow/sfr";
import Joi from "joi";

export default REST({
    validators: {
        "get-pet": {},
        "search-pet":{
            name: Joi.string().required(),

        },
        "get-pet-by-store": {
            store_name: Joi.string().required() // Use store name instead of store_id
        },
        "add-pet": {
            name: Joi.string().required(),
            breed: Joi.string().required(),
            age: Joi.number().required(),
            price: Joi.number().required(),
            store_name: Joi.string().required() // Store name instead of store_id
        },
        "add-pet-store": {
            name: Joi.string().required(),
            location: Joi.string().required(),
            contact: Joi.string().required()
        },
        "update-pet": {
            name: Joi.string().optional(),
            breed: Joi.string().optional(),
            age: Joi.number().optional(),
            price: Joi.number().optional(),
            store_name: Joi.string().optional()
        },
        "update-pet-store": {
            store_name: Joi.string().required(),
            name: Joi.string().optional(),
            location: Joi.string().optional(),
            contact: Joi.string().optional()
        },
        "delete-pet": {
            name: Joi.string().required()
        },
        "delete-pet-store": {
            store_name: Joi.string().required()
        }
    },

    handlers: {
        GET: {
            "get-pet": {
                async fn(req, res) {
                    let pets = await this.get_pets();
                    res.json(pets);
                }
            },
            "get-pet-by-store": {
                async fn(req, res) {
                    let pets = await this.get_pets_by_store(req.query.store_name);
                    res.json(pets);
                }
            },

            "search-pet":{
                async fn(req,res){
                    let pets= await this.search_pet(req.query.name);
                    res.json({pets})
                }
            }
        },
        

        POST: {
            "add-pet": {
                async fn(req, res) {
                    let pet = await this.add_pet(req.body);
                    if(!pet)return res.json({error : "Error"});
                    res.json({ success: `Added pet: ${req.body.name}` });
                }
            },
            "add-pet-store": {
                async fn(req, res) {
                    let store = await this.add_pet_store(req.body);
                    res.json({ success: `Added pet store: ${req.body.name}` });
                }
            }
        },

        PUT: {
            "update-pet": {
                async fn(req, res) {
                    let result = await this.update_pet(req.body);
                    res.json(result);
                }
            },
            "update-pet-store": {
                async fn(req, res) {
                    let result = await this.update_pet_store(req.body);
                    res.json(result);
                }
            }
        },

        DELETE: {
            "delete-pet": {
                async fn(req, res) {
                    let result = await this.delete_pet(req.body.name);
                    res.json(result);
                }
            },
            "delete-pet-store": {
                async fn(req, res) {
                    let result = await this.delete_pet_store(req.body.store_name);
                    res.json(result);
                }
            }
        }
    },

    controllers: {
        async get_pets() {
            return this.db.collection("pets").find({}).toArray();
        },

        async search_pet(name){
            return this.db.collection("pets").aggregate([
                {
                  '$match': {
                    'name': {
                      '$regex': name
                    }
                  }
                }, {
                  '$lookup': {
                    'from': 'pet_stores', 
                    'localField': 'store', 
                    'foreignField': '_id', 
                    'as': 'store'
                  }
                }, {
                  '$unwind': '$store'
                }
              ]).toArray();
        },

        async get_pets_by_store(store_name) {
            // Find the store by name
            let store = await this.db.collection("pet_stores").findOne({ name: store_name });

            if (!store) return [];

            // Find pets associated with this store
            return this.db.collection("pets").find({ store_name }).toArray();
        },

        async add_pet(body) {
            let store_result = await this.db.collection("pet_stores").findOne({name : body.store_name});
            console.log(body.store_name)
            if(!store_result)return null;

            body.store = store_result._id;            
            delete body.store_name;
            return this.db.collection("pets").insertOne(body);
        },

        async add_pet_store(body) {
            return this.db.collection("pet_stores").insertOne(body);
        },

        async update_pet(body) {
            return this.db.collection("pets").updateOne(
                { name: body.name },
                { $set: body }
            );
        },

        async update_pet_store(body) {
            return this.db.collection("pet_stores").updateOne(
                { name: body.store_name },
                { $set: body }
            );
        },

        async delete_pet(name) {
            return this.db.collection("pets").deleteOne({ name: name });
        },

        async delete_pet_store(store_name) {
            return this.db.collection("pet_stores").deleteOne({ name: store_name });
        }
    }
});
