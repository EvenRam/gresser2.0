-- USER is a reserved keyword with Postgres
-- You must use double quotes in every query that user is in:
-- ex. SELECT * FROM "user";
-- Otherwise you will have errors!
CREATE TABLE "user" (
    "id" SERIAL PRIMARY KEY,
    "username" VARCHAR (80) UNIQUE NOT NULL,
    "password" VARCHAR (1000) NOT NULL
);


CREATE TABLE "user" (
 	 
    "id" SERIAL PRIMARY KEY,
    "first_name" VARCHAR (1000) NOT NULL,
    "last_name" VARCHAR (1000) NOT NULL,
    "phone_number" bigint,
    "location" VARCHAR (2000),
    "union_affiliation" VARCHAR (1000),
    "employee_number" bigint, 
    "email" VARCHAR (80) UNIQUE NOT NULL,
    "password" VARCHAR (1000) NOT NULL,
    "roleId" bigint,
    "active" boolean
    
);




CREATE TABLE "jobs" (
	"job_id" SERIAL PRIMARY KEY,
	"job_number" INT, 
	"job_name" VARCHAR (1000),
	"location" VARCHAR (1000),
	"start_date" date,
	"end_date" date,
    "status" VARCHAR(20) DEFAULT 'active'
	);


CREATE TABLE rain_days (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(job_id),
  date DATE NOT NULL,
  UNIQUE(job_id, date)
);


CREATE TABLE "add_employee" (
  "id" SERIAL PRIMARY KEY,
  "first_name" VARCHAR(80),
  "last_name" VARCHAR(80),
  "employee_number" VARCHAR(80),
  "employee_status" BOOLEAN,
  "phone_number" VARCHAR(80),
  "email" VARCHAR(80),
  "address" VARCHAR(120),
  "current_location" VARCHAR(50), 
  "job_id" INT,
  "union_id" INT,
  FOREIGN KEY ("job_id") REFERENCES "jobs" ("job_id"),
  FOREIGN KEY ("union_id") REFERENCES "unions" ("id")
);


CREATE TABLE "unions" (
    "id" SERIAL PRIMARY KEY,
    "union_name" VARCHAR(80)
);

	
