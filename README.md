USE seat_booking_system;
CREATE TABLE employees (
  id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  designation VARCHAR(100),
  department VARCHAR(100)
);
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT,
  day VARCHAR(10),
  time_slot VARCHAR(20),
  seat_number INT,
  week_start DATE,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  UNIQUE KEY unique_booking (day, time_slot, seat_number, week_start)
);



LOAD DATA INFILE 'C:\\ProgramData\\MySQL\\MySQL Server 8.0\\Uploads\\Employee_data.csv'
INTO TABLE seat_booking_system.employees
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"' 
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS
(id,name, designation, department);




