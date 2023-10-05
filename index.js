const cron = require('cron');
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits,ActivityType} = require('discord.js');
const { MongoClient } = require('mongodb')const TOKEN = process.env.TOKEN
const CLIENTID = process.env.CLIENTID
const GUILDID = process.env.GUILDID
const mongoclient = new MongoClient(URI, { useUnifiedTopology: true });
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const now = new Date();
const targetDate = new Date('2023-09-17T00:00:00-07:00');
const targetDate2 = new Date('2023-09-18T00:00:00-07:00');

mongoclient.connect(async function (err, mongoclient) {
	global.mongoclient = mongoclient;
	const update_rankings = require("./update-rankings.js");	 

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		client.commands.set(command.data.name, command);
	}		
	client.once(Events.ClientReady, () => {
		console.log('Ready!');
		client.user.setActivity(' for /help', { type: ActivityType.Watching });
		setInterval(() => {
			try{
        if (now < targetDate2) {
          	console.log("Updating rankings")
	  update_rankings.updateRankings(client, GUILDID, CHANNELID);
        }else{
          	console.log("Not updating rankings because season is over")
        }
			}catch{
				console.log("\nThere was an error while updating rankings\n")
			}
		  }, 1000*60*60*12);
	});


	client.on('guildMemberAdd', async member => {
		member.send("Welcome to the Ranked PDT server! To create an account, head to <#1085212287603843185> and use the </register:1085225509870379101> command. To see the rest of my commands, use the </help:1085953726705045677> command.");
		const mongoUsers = mongoclient.db("RankedPDT").collection("users");
		var results = await mongoUsers.findOne({id: member.id});
		if(results != null){
			var role= member.guild.roles.cache.find(role => role.name == "Debater");
			member.roles.add(role);
		}
	});
	client.on(Events.InteractionCreate, async interaction => {
		
		if (!interaction.isChatInputCommand()) return;
	
		
		if(interaction.channel.id != 1085212287603843185 && interaction.user.id != 681913214744789118 && interaction.user.id != 735892514481111042){
			return interaction.reply({ content: "Commands only work in <#1085212287603843185>", ephemeral: true });
		}
		if (now > targetDate && interaction.commandName == "update") {
			return interaction.reply({ content: "Rounds may no longer be reported because the current Ranked PDT season is over", ephemeral: true });
		}
		const command = client.commands.get(interaction.commandName);
	
		if (!command) return;
	
		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
	});
	client.login(TOKEN);
	})
