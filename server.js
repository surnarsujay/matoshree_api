const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');
const multer = require('multer');
const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));




// const config = {
//   user: 'sa',
//   password: '12345678',
//   server: 'MSI\\SQLEXPRESS',
//   database: 'Matoshree',
// };

const config = {
  user: 'fg_minterior',
  password: '@J220a3qq',
  server: '51.255.229.25',
  database: 'lissom_minterior1'
};


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get('/',(req, res) => {
    res.send("Welcome to the home page");
})
// Event table where event are stored 

app.post('/submit_form', upload.single('file_img'), async (req, res) => {
  const { body, file } = req;

  try {
    await sql.connect(config);

    const request = new sql.Request();
    await request.input('eventName', sql.VarChar, body.eventName)
      .input('eventLocation', sql.VarChar, body.eventLocation)
      .input('eventDate', sql.VarChar, body.eventDate)
      .input('description', sql.VarChar, body.description)
      .input('file_img', sql.VarBinary, file.buffer)
      .query(`
        INSERT INTO Tbl_Event 
        (EventName, EventLocation,EventDate, Description, Img)
        VALUES
        (@eventName, @eventLocation, @eventDate, @description, @file_img)
      `);

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Internal Server Error' });
  } finally {
    sql.close();
  }
});




// fetch event table data in backend table and also  show in website

// app.get('/api/events', async (req, res) => {
//   try {
//     let pool = await sql.connect(config);
//     let result = await pool.request().query('SELECT * FROM Tbl_Event');
//     res.json(result.recordset);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Server Error');
//   }
// });


app.get('/api/events', async (req, res) => {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request().query('SELECT * FROM Tbl_Event');

    const events = result.recordset.map((event) => {
      return {
        ...event,
        Img: event.Img ? Buffer.from(event.Img, 'hex').toString('base64') : null,
      };
    });

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


// get events by id for edit/update


app.get('/api/events/:EventID', async (req, res) => {
  const eventId = req.params.EventID;

  try {
    let pool = await sql.connect(config);
    let result = await pool
      .request()
      .input('id', sql.Int, eventId)
      .query('SELECT * FROM Tbl_Event WHERE EventID = @id');

    const event = result.recordset[0];

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    const eventDetails = {
      EventID: event.EventID,
      EventName: event.EventName,
      EventLocation: event.EventLocation,
      EventDate: event.EventDate,
      Description: event.Description,
      Img: event.Img ? Buffer.from(event.Img, 'hex').toString('base64') : null,
    };

    res.json({ success: true, data: [eventDetails] });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// save event  header  image in database 

app.post('/submit_header', upload.single('file_img'), async (req, res) => {
  const { body, file } = req;

  try {
    await sql.connect(config);

    const request = new sql.Request();
    await request
      .input('file_img', sql.VarBinary, file.buffer)
      .query(`
        INSERT INTO Tbl_Header
        (head_Event)
        VALUES
        (@file_img)
      `);

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Internal Server Error' });
  } finally {
    sql.close();
  }
});


// get event header from database and show in website to event header 

app.get('/api/get_event_header', async (req, res) => {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request().query('SELECT * FROM Tbl_Header WHERE img_id = (SELECT MAX(img_id) FROM Tbl_Header)');

    const seteventheads = result.recordset.map((seteventhead) => {
      return {
        ...seteventhead,
        head_Event: seteventhead.head_Event ? Buffer.from(seteventhead.head_Event, 'hex').toString('base64') : null,
      };
    });

    res.json(seteventheads);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


/// Delete table data from event table

app.delete('/delete_event/:EventID', async (req, res) => {
  const eventId = req.params.EventID;

  try {
    await sql.connect(config);

    const request = new sql.Request();
    await request
      .input('id', sql.Int, eventId)
      .query('DELETE FROM Tbl_Event WHERE EventID = @id');

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Internal Server Error' });
  } finally {
    sql.close();
  }
});




// update events 

app.put('/update_event/:EventID', upload.single('file_img'), async (req, res) => {
  const eventId = req.params.EventID;
  const { body, file } = req;

  try {
    await sql.connect(config);
    const request = new sql.Request();
    if (file) {
      await request
        .input('eventName', sql.VarChar, body.eventName)
        .input('eventLocation', sql.VarChar, body.eventLocation)
        .input('eventDate', sql.VarChar, body.eventDate)
        .input('description', sql.VarChar, body.description)
        .input('file_img', sql.VarBinary, file.buffer)
        .input('id', sql.Int, eventId)
        .query(`
                  UPDATE Tbl_Event
                  SET EventName = @eventName,
                      EventLocation = @eventLocation,
                      EventDate = @eventDate,
                      Description = @description,
                      Img = @file_img
                  WHERE EventID = @id
              `);
    } else {
      await request
        .input('eventName', sql.VarChar, body.eventName)
        .input('eventLocation', sql.VarChar, body.eventLocation)
        .input('eventDate', sql.VarChar, body.eventDate)
        .input('description', sql.VarChar, body.description)
        .input('id', sql.Int, eventId)
        .query(`
                  UPDATE Tbl_Event
                  SET EventName = @eventName,
                      EventLocation = @eventLocation,
                      EventDate = @eventDate,
                      Description = @description
                  WHERE EventID = @id
              `);
    }

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Internal Server Error' });
  } finally {
    sql.close();
  }
});


// save aboutus data from backend to databse


app.post('/submit_Aboutus_Data', upload.single('aboutImage'), async (req, res) => {
  const { body, file } = req;

  try {
    await sql.connect(config);

    const request = new sql.Request();
    await request
      .input('aboutImage', sql.VarBinary, file.buffer)
      .input('aboutDescription', sql.VarChar, body.aboutDescription)
      .query(`
        INSERT INTO Tbl_AboutUs 
        (Aboutus_img, About_Description)
        VALUES
        (@aboutImage, @aboutDescription)
      `);

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Internal Server Error' });
  } finally {
    sql.close();
  }
});

// get aboutus img from and stoored in header in website

app.get('/api/getaboutus', async (req, res) => {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request().query('SELECT * FROM Tbl_AboutUs WHERE About_Id = (SELECT MAX(About_Id) FROM Tbl_AboutUs)');



    const setaboutheads = result.recordset.map((setabouthead) => {
      return {
        ...setabouthead,
        Aboutus_img: setabouthead.Aboutus_img ? Buffer.from(setabouthead.Aboutus_img, 'hex').toString('base64') : null,
      };
    });

    res.json(setaboutheads);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});






// save founders data to databse table :- Tbl_founders

app.post('/submit_Founders_Data', upload.single('founderImage'), async (req, res) => {
  const { body, file } = req;

  try {
    if (!file || !file.buffer) {
      return res.status(400).send({ success: false, message: 'Invalid file object' });
    }

    await sql.connect(config);

    const request = new sql.Request();
    await request
      .input('founderImage', sql.VarBinary, file.buffer)
      .input('founderName', sql.VarChar, body.founderName)
      .input('founderRole', sql.VarChar, body.founderRole)
      .input('founderDescription', sql.VarChar, body.founderDescription)
      .query(`
        INSERT INTO Tbl_Foundrs 
        (Founders_img, Founders_Name, Founders_Role, Founders_Description)
        VALUES
        (@founderImage, @founderName, @founderRole, @founderDescription)
      `);

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Internal Server Error' });
  } finally {
    sql.close();
  }
});



// add project in databse 


app.post('/submit_projects', upload.single('file_img'), async (req, res) => {
  const { body, file } = req;

  try {
    await sql.connect(config);

    const request = new sql.Request();
    await request.input('projectName', sql.NVarChar, body.projectName)
      .input('projectLocation', sql.NVarChar, body.projectLocation)
      .input('projectDate', sql.DateTime, body.projectDate)
      .input('description', sql.NVarChar, body.description)
      .input('file_img', sql.VarBinary, file.buffer)
      .query(`
        INSERT INTO Tbl_Project
        (Project_Name, Project_location,Project_Date, Project_Description, file_img)
        VALUES
        (@projectName, @projectLocation, @projectDate, @description, @file_img)
      `);

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Internal Server Error' });
  } finally {
    sql.close();
  }
});


// get project from database and stored in backend table and also show in website in card format




app.get('/api/projects', async (req, res) => {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request().query('SELECT * FROM  Tbl_Project');

    const events = result.recordset.map((event) => {
      return {
        ...event,
        file_img: event.file_img ? Buffer.from(event.file_img, 'hex').toString('base64') : null,
      };
    });

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


// Delete project from database .......

app.delete('/delete_project/:id', async (req, res) => {
  const projectId = req.params.id;

  try {
    await sql.connect(config);

    const request = new sql.Request();
    await request
      .input('id', sql.Int, projectId)
      .query('DELETE FROM Tbl_Project WHERE id = @id');

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Internal Server Error' });
  } finally {
    sql.close();
  }
});

//update project 



app.put('/update_projects', upload.single('file_img'), async (req, res) => {
  const projectId = req.params.id;

  const { body, file } = req;


  try {
    await sql.connect(config);

    const request = new sql.Request();
    await request.input('projectName', sql.NVarChar, body.projectName)
      .input('id', sql.Int, projectId)
      .input('projectLocation', sql.NVarChar, body.projectLocation)
      .input('projectDate', sql.DateTime, body.projectDate)
      .input('description', sql.NVarChar, body.description)
      .input('file_img', sql.VarBinary, file.buffer)
      .query(`
      UPDATE  Tbl_Project SET
      Project_Name = @projectName,
      Project_location =  @projectLocation,
      Project_Date = @projectDate,
      Project_Description = @description,
      file_img = @file_img
      `);

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Internal Server Error' });
  } finally {
    sql.close();
  }
});

// save Home data to databse table :- Tbl_home


app.post('/submitHomedata', upload.single('file_video'), async (req, res) => {
  const { body, file } = req;

  try {
    if (!file || !file.buffer) {
      return res.status(400).send({ success: false, message: 'Invalid file object' });
    }

    await sql.connect(config);

    const request = new sql.Request();
    await request
      .input('file_video', sql.VarBinary, file.buffer)
      .input('aboutProject', sql.VarChar, body.aboutProject)
      .input('whoWeAre', sql.VarChar, body.whoWeAre)
      .input('ourMission', sql.VarChar, body.ourMission)
      .input('ourVision', sql.VarChar, body.ourVision)
      .input('experties', sql.VarChar, body.experties)
      .input('quality', sql.VarChar, body.quality)
      .input('clientApproch', sql.VarChar, body.clientApproch)
      .input('timelyDelivery', sql.VarChar, body.timelyDelivery)
      .query(`
      INSERT INTO Tbl_Home 
      (Video, aboutProject, whoWeAre, ourMission, ourVision, experties, quality, clientApproch, timelyDelivery)
      VALUES
      (@file_video, @aboutProject, @whoWeAre, @ourMission, @ourVision, @experties, @quality, @clientApproch, @timelyDelivery)
      
      `);

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Internal Server Error' });
  } finally {
    sql.close();
  }
});



// // save Services we offer  data to databse table :- Tbl_services

app.post('/submit_Services_Data', upload.single('aboutImage'), async (req, res) => {
  const { body, file } = req;

  try {
    await sql.connect(config);

    const request = new sql.Request();
    await request
      .input('aboutImage', sql.VarBinary, file.buffer)
      .input('aboutDescription', sql.VarChar, body.aboutDescription)
      .query(`
        INSERT INTO Tbl_services 
        (Service_img, Service_Name)
        VALUES
        (@aboutImage, @aboutDescription)
      `);

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Internal Server Error' });
  } finally {
    sql.close();
  }
});



// get services from tbl and show in website

app.get('/api/getservices', async (req, res) => {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request().query('SELECT * FROM Tbl_services');

    const gallerys = result.recordset.map((services) => {
      return {
        ...services,
        Service_img: services.Service_img ? Buffer.from(services.Service_img, 'hex').toString('base64') : null,
      };
    });

    res.json(gallerys);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});



// // save Gallery  to databse table :- Tbl_gallery

app.post('/submit_gallery', upload.single('file_img'), async (req, res) => {
  const { body, file } = req;

  try {
    await sql.connect(config);

    const request = new sql.Request();
    await request
      .input('file_img', sql.VarBinary, file.buffer)
      .query(`
        INSERT INTO Tbl_Gallery
        (Allimg)
        VALUES
        (@file_img)
      `);

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Internal Server Error' });
  } finally {
    sql.close();
  }
});

// get from gallery tbl and show into website

app.get('/api/getimg', async (req, res) => {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request().query('SELECT * FROM Tbl_Gallery');

    const gallerys = result.recordset.map((gallery) => {
      return {
        ...gallery,
        Allimg: gallery.Allimg ? Buffer.from(gallery.Allimg, 'hex').toString('base64') : null,
      };
    });

    res.json(gallerys);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});



// save gallery head to database


app.post('/submit_gallery_head', upload.single('headerimg'), async (req, res) => {
  const { body, file } = req;

  try {
    await sql.connect(config);

    const request = new sql.Request();
    await request
      .input('headerimg', sql.VarBinary, file.buffer)
      .query(`
        INSERT INTO Tbl_Galleryhead
        (head_Gallery)
        VALUES
        (@headerimg)
      `);

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Internal Server Error' });
  } finally {
    sql.close();
  }
});


// get gallery head image and show website

app.get('/api/get_header_img', async (req, res) => {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request().query('SELECT * FROM Tbl_Galleryhead WHERE id = (SELECT MAX(id) FROM Tbl_Galleryhead)');

    const galleryheads = result.recordset.map((galleryhead) => {
      return {
        ...galleryhead,
        head_Gallery: galleryhead.head_Gallery ? Buffer.from(galleryhead.head_Gallery, 'hex').toString('base64') : null,
      };
    });

    res.json(galleryheads);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


// save careerbackend data in career table 

app.post('/submit_Career_Data', upload.single('images'), async (req, res) => {
  const { body, file } = req;

  try {
    if (!file || !file.buffer) {
      return res.status(400).send({ success: false, message: 'Invalid file object' });
    }

    await sql.connect(config);

    const request = new sql.Request();
    await request
      .input('images', sql.VarBinary, file.buffer)
      .input('address1', sql.VarChar, body.address1)
      // .input('address2', sql.VarChar, body.address2)
      .input('contact', sql.VarChar, body.contact)
      .input('openings', sql.VarChar, body.openings)
      .query(`
        INSERT INTO Tbl_Careersbackend 
        (image, Address, Contact, Openings)
        VALUES
        (@images, @address1,  @contact,@openings)
      `);

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Internal Server Error' });
  } finally {
    sql.close();
  }
});




// get career head from tbl and show into  website

app.get('/api/career_head_img', async (req, res) => {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request().query('SELECT * FROM Tbl_Careersbackend WHERE id = (SELECT MAX(id) FROM Tbl_Careersbackend)');

    const getcareerheads = result.recordset.map((getcareerhead) => {
      return {
        ...getcareerhead,
        Image: getcareerhead.Image ? Buffer.from(getcareerhead.Image, 'hex').toString('base64') : null,
      };
    });

    res.json(getcareerheads);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});









// save contactusbackend data in contactusbackend table 

app.post('/submit_Contactusback_Data', upload.single('images'), async (req, res) => {
  const { body, file } = req;

  try {
    if (!file || !file.buffer) {
      return res.status(400).send({ success: false, message: 'Invalid file object' });
    }

    await sql.connect(config);

    const request = new sql.Request();
    await request
      .input('images', sql.VarBinary, file.buffer)
      .input('address1', sql.VarChar, body.address1)
      .input('email', sql.VarChar, body.email)
      .input('contact', sql.VarChar, body.contact)
      .query(`
        INSERT INTO Tbl_Contactusbackend 
        (image, Address,Email, Contact)
        VALUES
        (@images, @address1,  @email,@contact)
      `);

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Internal Server Error' });
  } finally {
    sql.close();
  }
});


// get contactus head from tbl and show into  website

app.get('/api/contactus_head', async (req, res) => {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request().query('SELECT * FROM Tbl_Contactusbackend WHERE id = (SELECT MAX(id) FROM Tbl_Contactusbackend)');

    const getheads = result.recordset.map((gethead) => {
      return {
        ...gethead,
        Image: gethead.Image ? Buffer.from(gethead.Image, 'hex').toString('base64') : null,
      };
    });

    res.json(getheads);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});





// save logo to database

app.post('/save_logo', upload.single('file_img'), async (req, res) => {
  const { body, file } = req;

  try {
    await sql.connect(config);

    const request = new sql.Request();
    await request
      .input('file_img', sql.VarBinary, file.buffer)
      .query(`
        INSERT INTO Tbl_Logo
        (logo)
        VALUES
        (@file_img)
      `);

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Internal Server Error' });
  } finally {
    sql.close();
  }
});


// get logo from databse


app.get('/api/getlogo', async (req, res) => {
  try {
    let pool = await sql.connect(config);
    // let result = await pool.request().query('SELECT * FROM Tbl_logo');
    let result = await pool.request().query('SELECT * FROM Tbl_logo WHERE id = (SELECT MAX(id) FROM Tbl_logo)');
    const setlogos = result.recordset.map((setlogo) => {
      return {
        ...setlogo,
        logo: setlogo.logo ? Buffer.from(setlogo.logo, 'hex').toString('base64') : null,
      };
    });

    res.json(setlogos);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

//save  testimonial section to database


app.post('/add_testimonial', async (req, res) => {
  const { body } = req;

  try {
    await sql.connect(config);

    const request = new sql.Request();
    await request
      .input('clientName', sql.NVarChar, body.clientName)
      .input('clientPosition', sql.NVarChar, body.clientPosition)
      .input('address', sql.NVarChar, body.address)
      .input('comment', sql.NVarChar, body.comment)
      .query(`
        INSERT INTO Tbl_Testimonial 
        (Client_name, Client_position, Address, Comment)
        VALUES
        (@clientName, @clientPosition, @address, @comment)
      `);

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Internal Server Error' });
  } finally {
    sql.close();
  }
});

// get values from testimonial 

app.get('/get_testimonials', async (req, res) => {
  try {
    await sql.connect(config);

    const request = new sql.Request();
    const result = await request.query('SELECT * FROM Tbl_Testimonial');

    res.send(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Internal Server Error' });
  } finally {
    sql.close();
  }
});



// User login ...................................


app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, password)
      .query('SELECT * FROM Tbl_Users WHERE Email = @email AND Password = @password');

    if (result.recordset.length > 0) {
      // Successful login
      res.sendStatus(200);
    } else {
      // Login failed
      res.sendStatus(401);
    }
  } catch (error) {
    console.error('Database error:', error);
    res.sendStatus(500);
  }
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// here is all form data api where form data stored in databse 

// enquiry form data saved in database table :- Tbl_EnquiryForm 

app.post('/enquiryform/submitForm', async (req, res) => {
  const { name, email, phone, address, message } = req.body;

  try {
    await sql.connect(config);

    const request = new sql.Request();
    await request.query(`
          INSERT INTO Tbl_EnquiryForm (name, email, contactnumber, address, message)
          VALUES ('${name}', '${email}', '${phone}', '${address}', '${message}')
      `);

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Internal Server Error' });
  } finally {
    sql.close();
  }
});

//// Contact us form data saved in database table :- Tbl_ContactUs 

app.post('/contactus/submitForm', async (req, res) => {
  const { name, email, phone, message } = req.body;

  try {
    await sql.connect(config);

    const request = new sql.Request();
    await request.query(`
          INSERT INTO Tbl_ContactUs (name, email, phone, message)
          VALUES ('${name}', '${email}', '${phone}', '${message}')
      `);

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Internal Server Error' });
  } finally {
    sql.close();
  }
});


////Career form data saved in database table :- Tbl_Careers 

app.post('/careers/submitForm', upload.single('resume'), async (req, res) => {
  const { body, file } = req;

  try {
    await sql.connect(config);

    const request = new sql.Request();
    await request.input('firstName', sql.VarChar, body.firstName)
      .input('middleName', sql.VarChar, body.middleName)
      .input('lastName', sql.VarChar, body.lastName)
      .input('email', sql.VarChar, body.email)
      .input('phoneNumber', sql.VarChar, body.phoneNumber)
      .input('selectedPost', sql.VarChar, body.selectedPost)
      .input('currentLocation', sql.VarChar, body.currentLocation)
      .input('currentEmployer', sql.VarChar, body.currentEmployer)
      .input('experience', sql.VarChar, body.experience)
      .input('qualification', sql.VarChar, body.qualification)
      .input('resume', sql.VarBinary, file.buffer)
      .query(`
      INSERT INTO Tbl_Careers 
      (FirstName, MiddleName, LastName, Email, MobileNumber, AppliedPost, CurrentLocation, CurrentEmployer, Experience, Qualification, Resume)
      VALUES
      (@firstName, @middleName, @lastName, @email, @phoneNumber, @selectedPost, @currentLocation, @currentEmployer, @experience, @qualification, @resume)
    `);

    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: 'Internal Server Error' });
  } finally {
    sql.close();
  }
});

// here is hr policies come from database Table :- Tbl_hrpolicies

const connectionPromise = sql.connect(config);

app.get('/api/hrpolicies', async (req, res) => {
  try {
    const connection = await connectionPromise;
    const request = new sql.Request(connection);
    const result = await request.query('SELECT message FROM Tbl_hrpolicies');

    if (result.recordset.length > 0) {
      res.json({ message: result.recordset[0].message });
    } else {
      res.status(404).send('No policy message found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});









// 
const PORT = process.env.PORT || 3001;
// const PORT = process.env.PORT || 8443;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


