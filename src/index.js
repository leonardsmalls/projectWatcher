const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
// Get the client
const mysql = require('mysql2');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

ipcMain.on('get-file', (event, fileName, specifiedDriveLetter) => {
  const pathString = path.join(specifiedDriveLetter + '\\waterjetData\\' + fileName + '.json');

  if (fs.existsSync(path.join(specifiedDriveLetter + '\\waterjetData\\'))) {
    const data = fs.readFileSync(pathString, 'utf8');

    event.sender.send('get-file-response', data, fileName)
    console.log('file got and res and logged');
  } else {
    console.log('no exist - getFile');
  }
});

ipcMain.on('create-or-relocate-directory', (event, action, projectSpecs, specifiedDriveLetter) => {
  console.log(projectSpecs);
  console.log(action);

  if (action == 'dump') {
    const pathStringClient = path.join(specifiedDriveLetter + '\\waterjetData\\fileQueue');
    console.log(projectSpecs)

    if (fs.existsSync(pathStringClient)) {
      console.log('pathStringClient exists');
    } else {
      fs.mkdirSync(pathStringClient);
      console.log('pathStringClient created');
    }

    projectSpecs.forEach((tempFileObj) => {
      //fs.copyFileSync(tempFileObj.path, path.join(pathStringClient + '\\' + tempFileObj.path.split('\\').pop()));
      fs.copyFileSync(tempFileObj.path, path.join(pathStringClient + '\\' + tempFileObj.name + '.' + tempFileObj.type));
    })

  } else if (action == 'relocate') {
    const pathStringClient = path.join(specifiedDriveLetter + '\\waterjetData\\' + projectSpecs.status + '\\' + projectSpecs.client_name);
    const pathStringClientProject = path.join(specifiedDriveLetter + '\\waterjetData\\' + projectSpecs.status + '\\' + projectSpecs.client_name + '\\' + projectSpecs.project_name);

    let oldStatusDirectoryPath;
    let oldStatus;

    switch(projectSpecs.status) {
      case 'inProgress':
        oldStatus = 'pending';
        break;
      case 'completed':
        oldStatus = 'inProgress';
        break;
      case 'archived':
        oldStatus = 'completed';
        break;
      default:
        oldStatus = 'pending';
    }

    oldStatusDirectoryPath = path.join(specifiedDriveLetter + '\\waterjetData\\' + oldStatus + '\\' + projectSpecs.client_name + '\\' + projectSpecs.project_name);

    if (fs.existsSync(pathStringClient)) {
      console.log('pathStringClient exists');
    } else {
      fs.mkdirSync(pathStringClient);
      console.log('pathStringClient created');
    }

    if (fs.existsSync(pathStringClientProject)) {
      console.log('pathStringClientProject exists');
    } else {
      fs.mkdirSync(pathStringClientProject);
      console.log('pathStringClientProject created');
    }

    fs.copyFileSync(oldStatusDirectoryPath, pathStringClientProject);

  } else {
    const pathStringClient = path.join(specifiedDriveLetter + '\\waterjetData\\' + projectSpecs.status + '\\' + projectSpecs.client_name);
    const pathStringClientProject = path.join(specifiedDriveLetter + '\\waterjetData\\' + projectSpecs.status + '\\' + projectSpecs.client_name + '\\' + projectSpecs.project_name);

    if (fs.existsSync(pathStringClient)) {
      console.log('pathStringClient exists');
    } else {
      fs.mkdirSync(pathStringClient);
      console.log('pathStringClient created');
    }

    if (fs.existsSync(pathStringClientProject)) {
      console.log('pathStringClientProject exists');
    } else {
      fs.mkdirSync(pathStringClientProject);
      console.log('pathStringClientProject created');
    }

    for (let projectSpec in projectSpecs) {
      if (projectSpec == 'files') {
        projectSpecs[projectSpec].forEach((file) => {
          console.log(file);
          fs.copyFileSync(file.path, path.join(pathStringClientProject + '\\' + file.name + '.' + file.type));
        })
      //console.log(projectSpecs[projectSpec]);
      }
    }
  }
});

ipcMain.on('write-to-file', (event, data, fileName, specifiedDriveLetter) => {
  const pathString = path.join(specifiedDriveLetter + '\\waterjetData\\' + fileName + '.json');

  if (fs.existsSync(path.join(specifiedDriveLetter + '\\waterjetData\\'))) {
    fs.writeFileSync(pathString, data, {'flag':'a'},  function(err) {
      if (err) {
          return console.error(err);
      }
    });

    event.sender.send('file-written-to', data, fileName)
    console.log('file written to');
  } else {
    console.log('no exist - writeToFile');
  }
});

ipcMain.on('watch-file', (event, fileName, specifiedDriveLetter) => {
  const pathString = path.join(specifiedDriveLetter + '\\waterjetData\\' + fileName + '.json');

  if (fs.existsSync(path.join(specifiedDriveLetter + '\\waterjetData\\'))) {
    fs.watch(pathString, (eventType, filename) => {
      if (filename) {
        event.sender.send('file-changed', filename)
      }
    });
  } else {
    console.log('no exist - watch');
  }  
});

ipcMain.on('open-file-in-application', (event, specifiedDriveLetter) => {
  const editorPath = "C:\\*****\\*****\\*****\\*****\\arduino-ide.exe";

  shell.openPath(editorPath);
});

ipcMain.on('database-interaction', (event, interaction, intendedQuery, projectData) => {

  console.log(interaction + ' outside!');
  console.log(projectData);
  
  const dbConnect = async (interaction) => {
    try {
    // Add the credentials to access your database
    var connection = mysql.createConnection({
      host: 1,
      user: 1,
      password: 1,
      database: 1,
    });

    // connect to mysql
    connection.connect(function(err) {
        // in case of error
        if(err){
            console.log(err.code);
            console.log(err.fatal);
        }
    });

    // Perform a query
    $query = 'SELECT * FROM `projects` LIMIT 10';

    if (interaction == 'connect') {
        connection.query("SELECT * FROM projects", (err, data) => {
          if (err) throw(err)
          console.log(data);

          event.sender.send('database-interaction-response', data);
        });
      } else if (interaction == 'get') {
        connection.query(intendedQuery, (err, data) => {
          if (err) throw(err)
          console.log(data);

          event.sender.send('database-interaction-response', data);
        });
      } else if (interaction == 'insert') {
        connection.query(intendedQuery, (err, data) => {
          if (err) throw(err)
          console.log(data);

          event.sender.send('database-interaction-response', data);
        });
      }

    // Close the connection
    connection.end(function(){
        // The connection has been closed
    });

  } catch (err) {
    console.log(err);
  }
}
  
  console.log('in the db area');

  dbConnect(interaction);
})

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      webSecurity: false,
      //nodeIntegration: true,
      contextIsolation: true, // Required for IPC to work
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
