const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits,ActivityType} = require('discord.js');
const { MongoClient } = require('mongodb')
const env = require('dotenv').config()
const URI = process.env.URI
const TOKEN = process.env.TOKEN;
const mongoclient = new MongoClient(URI, { useUnifiedTopology: true });
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
try{

	mongoclient.connect(async function (err, mongoclient) {
		global.mongoclient = mongoclient;
		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command = require(filePath);
			client.commands.set(command.data.name, command);
		}
		
		
		client.once(Events.ClientReady, () => {
			console.log('Ready!');
			client.user.setActivity(' for /help', { type: ActivityType.Watching });
		});
		client.on('guildMemberAdd', async member => {
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
		
		
}catch{
	console.log(err)
}
