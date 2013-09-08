/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var app = {
    
    db: "",
    
    // Application Constructor
    initialize: function() {        
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
    
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');
            
        var captureElements = document.body.querySelectorAll('.capture');
        for( var i = 0; i < captureElements.length; i++) {
            captureElements[i].setAttribute('style', 'display:block;');
        }
        
        app.db = window.openDatabase("scannerDB", "1.0", "Scanner DB", 1000000);
        app.db.transaction(
            function (tx) {
                //tx.executeSql('DROP TABLE IF EXISTS CODES');
                tx.executeSql('CREATE TABLE IF NOT EXISTS CODES (id INTEGER PRIMARY KEY AUTOINCREMENT, date, data, format)');
            },
            app.dberrorCB, 
            app.getCodeHistory
        );
        
        var scanButton = document.getElementById("scanButton");
        scanButton.onclick = function () {
            app.performScan();

        };
    },
    
    querySuccess: function ( tx, results ) {
        var listElement = document.getElementById('list'); 
        var len = results.rows.length;
        var output  =   '';
        for ( var i = 0; i < len; i ++ ) {
            var listItem = document.createElement('li');
                listItem.id = results.rows.item(i).id;
                listItem.innerHTML = results.rows.item(i).data;
                listItem.class = 'listItem';
                listItem.onclick = function () {
                    var thisID = this.getAttribute('id');
                    alert("querying for id " + thisID);
                    app.db.transaction( function ( tx ) {
                        tx.executeSql(
                            'SELECT * FROM CODES WHERE id = "' + thisID + '"',
                            [], 
                            app.recordResults, 
                            app.dberrorCB
                        );  
                    }, app.dberrorCB);
                };
        };
        
        listElement.appendChild(listItem);       
    },
    
    recordResults: function ( tx, results ) {
        if (results.rows.item(0).format == 'QR_CODE') {
            alert(results.rows.item(0).data);
            var ref = window.open(results.rows.item(0).data, '_blank', 'location=yes')
        } else {
            alert("not a QR Code");
        }
    },
    
    dberrorCB: function ( error ) {
        //alert("Error processing SQL: " + error.message);
    },
    
    getCodeHistory: function () {
        app.db.transaction( function ( tx ) {
            tx.executeSql(
                'SELECT * FROM CODES', 
                [], 
                app.querySuccess, 
                app.dberrorCB
            );  
        }, app.dberrorCB);
    },
    
    performScan: function () {
      var scanner = cordova.require("cordova/plugin/BarcodeScanner");
        scanner.scan(
            function (result) { 
                // Insert item into database
                app.db.transaction(function ( tx ) {
                   tx.executeSql(
                       'INSERT INTO CODES (data, format) VALUES ("' + result.text + '", "' + result.format + '")'); 
                }, 
                    app.dberrorCB, 
                    app.getCodeHistory
                );
            }, 
            function (error) { 
                alert("Scanning failed: " + error); 
            } 
        );
    },
};
