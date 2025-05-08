import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase(
  {name: 'appointments.db', location: 'default'},
  () => {
    console.log('Database opened successfully');
  },
  (error: any) => console.log('Error opening database:', error),
);

export const initializeDatabase = () => {
  db.executeSql('PRAGMA foreign_keys = ON;');

  db.transaction((tx: any) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        contact TEXT,
        date TEXT,
        time TEXT,
        reason TEXT,
        status TEXT DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
      [],
      () => {
        console.log('Appointments table created successfully');
      },
      (error: any) => {
        console.error('Error creating appointments table:', error);
      },
    );
  });

  db.transaction((tx: any) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appointment_id INTEGER,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id)
      );`,
      [],
      () => {
        console.log('Feedback table created successfully');
      },
      (error: any) => {
        console.error('Error creating feedback table:', error);
      },
    );
  });
};

export const saveFeedback = (
  rating: number,
  comment: string = '',
  appointmentId: number | null = null,
) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'INSERT INTO feedback (rating, comment, appointment_id, created_at) VALUES (?, ?, ?, datetime("now"))',
        [rating, comment, appointmentId],
        (_: any, result: any) => {
          console.log('Feedback saved successfully');
          resolve(result);
        },
        (_: any, error: any) => {
          console.error('Error saving feedback:', error);
          reject(error);
        },
      );
    });
  });
};

export const getAppointmentFeedback = (appointmentId: number) => {
  return new Promise<any>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'SELECT * FROM feedback WHERE appointment_id = ?',
        [appointmentId],
        (
          _: any,
          result: {rows: {length: number; item: (arg0: number) => any}},
        ) => {
          if (result.rows.length > 0) {
            resolve(result.rows.item(0));
          } else {
            resolve(null);
          }
        },
        (_: any, error: any) => {
          reject(error);
        },
      );
    });
  });
};

export const getAllFeedback = () => {
  return new Promise<any[]>((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        'SELECT * FROM feedback ORDER BY created_at DESC',
        [],
        (
          _: any,
          result: {rows: {length: number; item: (arg0: number) => any}},
        ) => {
          const feedbackList = [];
          for (let i = 0; i < result.rows.length; i++) {
            feedbackList.push(result.rows.item(i));
          }
          resolve(feedbackList);
        },
        (_: any, error: any) => {
          reject(error);
        },
      );
    });
  });
};

export const getDB = () => db;
