#!/bin/bash
jsdoc2md --json --src ./groupaccount-client.js |  dmd --name-format -t ./groupaccount.hbs  
