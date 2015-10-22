# vantage-repl-mysql
Multiline MySQL REPL extension for vantage.js

Workaround for remote connections, multiline will only work on local ( using .show(); ) tty.

##### Installation

```bash
npm install vantage
npm install vantage-repl-mysql
```

##### Programmatic use

```js
// index.js
var Vantage = require('vantage')
  , repl = require('vantage-repl-mysql')
  ;

Vantage()
  .delimiter('node~$')
  .use(repl, {
    host     : 'localhost',
    user     : 'root',
    password : null, // for a XAMP installed MariaDB
    database : null
  })
  .show();
```

```bash
$ node app.js
node~$ 
node~$ mysql
 (Banner is shown, presented below ..)
node~$ mysql>
node~$ mysql> SELECT
node~$    ... 1 + 1
node~$    ... AS solution;
[ { solution: 2 } ]
Rows: 1
node~$ mysql> ..
node~$
```

##### What it does

it adds a version group command, that all modules may use to add their version
```
node~$ version

  Commands:

    version mysql        MySQL REPL version 1.0.0

```

You may open the help to see its details, and possible commands
```
node~$ version mysql
Author
 * Nabil Redmann (BananaAcid)
 * bananaacid.de
INFO
 * simple MySQL REPL

Commands:
 - version mysql
 - mysql
 ```

The banner shown above, when entering the REPL
```
node~$ mysql
 In REPL you can execute MySQL queries.
 * Semicolon ends a command, until then, enter creates a multiline statement
 * execute "USE databasename;" to be able to work with a table
 * t?  executes "SHOW TABLES;"
 * db? executes "SHOW DATABASES;"
 * q?  displays the last executed command
 * qq? executes the last executed command
 **|Use "exit" or ".." to close the REPL.
```