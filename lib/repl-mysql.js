/**
 * @author Nabil Redmann (BananaAcid)
 * @url    banaacid.de/
 */


/*
   problems with vantage/vorpal: 
   		cb(errMsg, ...)		->  error message is only shown on server, and only if it is the TTY, the remote client will hang and wait

		Vantage.exec('exit') -> will NOT execute on client :/

		connecting to other vantage from commandline
							-> old and new prompt (delimiter) will be shown
							-> not possible with dev.proj1.bananaacid.de as target host

		this.delimiter()	-> sets main delimiter PERMANENTLY
							-> THERE IS NO ALTERNATIVE for _modeDelimiter
*/


"use strict";


module.exports = function(Vantage, options) 
{
	const version = require('../package.json').version;

	const Util = require('util')
		, chalk = require('chalk')
		, stripAnsi = require('strip-ansi')
		, mysql = require('mysql')
		// access handler to variables stored in the user session (assumes .bind(this) before use)
		, instAccess = function() {this.session.instVals = this.session.instVals || {}; return this.session.instVals; };

	if (typeof(options) !== 'object')
		throw 'missing options={..} in Vantage.use()';


	// collects commands
	let VantageProxy = {
		_newOptions: [],
		command: function(cmd, desc)
		{ this._newOptions.push(cmd); return Vantage.command(cmd, desc); },
		mode: function(cmd, desc) { this._newOptions.push(cmd); return Vantage.mode(cmd, desc); },
		logNewCmds: function(Vantage_log) {Vantage_log( 'Commands:\n' + this._newOptions.map(function(i,e){ return ' - ' + i + '\n' }).join('') );}
	};


	VantageProxy
		.command('version mysql', 'MySQL REPL version ' + version)
		.action(function(cmd,cb) {
			let self = this, Vantage_log = function(m){ self.log( m ) };

			Vantage_log(
				'Author' + '\n'
				+' * Nabil Redmann (BananaAcid)' + '\n'
				+' * bananaacid.de' + '\n'
				+'INFO' + '\n'
				+' * Multiline (on local) MySQL REPL ' + '\n'
			);
			
			VantageProxy.logNewCmds(Vantage_log);
			cb();
		});


	VantageProxy
		.mode('mysql')
		.delimiter( chalk.green('mysql>') )
		.description('Starts a MySQL REPL.')
		.init(function(args, cb) {
			const inst = instAccess.bind(this);
			let self = this, Vantage_log = function(m){ self.log( m ) };

			// init vars. will be dependend on session!
			inst().connection = null;
			inst().commandLines = [];
			inst().isLocalInstance = (self.session.isLocal() && !self.session.client);
			inst().lastDelim = null;
			inst().lastDelimRoot = null;
			inst().lastCommand = null;


			Vantage_log(
				 ' In REPL you can execute MySQL queries.\n'
				+' * Semicolon ends a command' 
				+(inst().isLocalInstance ? 
					', until then, enter creates a multiline statement ' : ''
				 ) + '\n'
				+' * execute "USE databasename;" to be able to work with a table ' + '\n'
				+' * t?  executes "SHOW TABLES;" ' + '\n'
				+' * db? executes "SHOW DATABASES;" ' + '\n'
				+' * q?  displays the last executed command ' + '\n'
				+' * qq? executes the last executed command ' + '\n'
				+(inst().isLocalInstance ?
				 ' **|Use "exit" or ".." to close the REPL.' : ' **|Use "exit" to close the REPL.'
				 )
			);
			
			if (!inst().connection) {
				inst().connection = mysql.createConnection(options);
				inst().connection.connect(function(err) {
					if (err) {
						Vantage_log(err.toString());
						Vantage.exec('exit');
					}
					cb(err);
				});
			}
			else
				cb();
		})
		.action(function(command, cb) {
			const inst = instAccess.bind(this);
			let self = this;
			let Vantage_log = function(m){ self.log( m ) }
			  , Vantage_err = function(m){ self.log( chalk.red('Error: ') + m.toString().replace('Error:', '') ) };

			if (command == '..' && inst().isLocalInstance) {
				//Vantage.exec('exit'); // ---- SHOWS PROMPT MULTIPLE TIMES until key is pressed

				// keep from showing that extra prompt (bug) when using above line to exec exit
				Vantage.session._modeDelimiter = '';
				Vantage.session._mode = void(0);

				cb();

				return;
			}
			else if (command == 't?')
				command = 'SHOW TABLES;'
			else if (command == 'db?')
				command = 'SHOW DATABASES;'
			else if (command == 'q?')
			{
				command = null;
				Vantage_log('Query: ' + inst().lastCommand + '\n');
			}
			else if (command == 'qq?')
			{
				command = inst().lastCommand;
				Vantage_log('Query: ' + command + '\n');
			}

			// check if it is the server session
			if (inst().isLocalInstance) {
				let lastChar = command.trim().substr(-1);

				// if command has a terminator missing
				if (lastChar.length && lastChar != ';')
				{
					if (inst().lastDelim == null) {
						inst().commandLines = [];

						inst().lastDelim = self.session._modeDelimiter;
						inst().lastDelimRoot = self.session._delimiter;

						self.session._delimiter = new Array(stripAnsi(self.session._delimiter).length).join(' ');
						self.session._modeDelimiter = '    ' + chalk.green('...') + ' ';

						//this.delimiter(new Array(stripAnsi(inst().lastDelimRoot).length).join(' '));
					}

					inst().commandLines.push(command);
					command = null;
				}
				else
				{
					if (inst().lastDelim != null) {
						self.session._delimiter = inst().lastDelimRoot;
						self.session._modeDelimiter = inst().lastDelim;

						//this.delimiter(inst().lastDelimRoot);
						
						inst().lastDelim = null;
						command = inst().commandLines.join('\n') + '\n' + command;
					}
					
					inst().commandLines = [];
				}
			}

			if (command) {
				try {
					inst().connection.query(command, function(err, rows, fields) 
					{
						inst().lastCommand = command;

						if (err) {
							Vantage_err(err);
						}
						else
						{
							//let out = Util.inspect(fields.map(function(e){ return e.name; }), {showHidden: false, colors: true});
							//Vantage_log( 'fields: ' + out.substr(1, out.length-2) );
							Vantage_log( Util.inspect(rows, {showHidden: false, colors: true}) );
							
							if (rows.length)
								Vantage_log( 'Rows: ' + rows.length );
						}
						
						cb();
					});

				}
				catch (err) {
					Vantage_err(err); 
					cb();
				}
			}
			else
				cb();
		})
		.after(function(cb) {
			const inst = instAccess.bind(this);

			if (inst().connection)
				inst().connection.end();
			
			cb();
		});

};