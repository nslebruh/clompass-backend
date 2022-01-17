const { MongoClient } = require('mongodb');
const url = "mongodb+srv://clompassAdmin:clompassAdminPassword@clompass-cluster.ymbnr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
async function main() {
    try {
        await client.connect();
        const db = client.db("clompass");
        console.log("Connected to MongoDB");
        const collection = db.collection("students")
        const table = await collection.find({code: "10MATC", classes: []}).toArray();
        console.log(table)
        const result = await collection.updateOne({})

        //const result = await collection.insertOne({code: "LEB0003", subjects: []})
        //const result = await collection.updateOne({id: 1}, {$set: {users: [...table[0].users, "LEB0003"]}})
        //for (i=0; i>10; i++) {
        //    let result = await collection.insertOne({id: i, users: []})
        //    console.log(result)
        //}
        console.log(result);
    } finally {
        client.close();
    }
}
main().catch(console.error);