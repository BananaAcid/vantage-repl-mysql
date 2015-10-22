# vantage-repl-mysql
MySQL REPL extension for vantage.js

##### Installation

```bash
npm install vantage-repl-mysql
npm install vantage
```

##### Programmatic use

```js
// index.js
var Vantage = require('vantage')
  , repl = require('vantage-repl-mysql')
  ;

var vantage = Vantage();

vantage
  .delimiter('node~$')
  .use(repl, {
    host     : 'localhost',
    user     : 'me',
    password : 'secret',
    database : 'my_db'
  })
  .show();
```

```bash
$ node app.js
node~$ 
node~$ mysql
 (Banner is shown, presented below ..)
node~$ mysql>
node~$ mysql> SELECT 1 + 1 AS solution
...result...
node~$ js> ..
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
node~$ js
 In REPL you can execute MySQL queries.
 **|Use "exit" or ".." to close the REPL. Use "..-" to exit completely.
```