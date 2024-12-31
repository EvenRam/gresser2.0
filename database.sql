-- USER is a reserved keyword with Postgres
-- You must use double quotes in every query that user is in:
-- ex. SELECT * FROM "user";
-- Otherwise you will have errors!



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


CREATE TABLE "unions" (
  "id" SERIAL PRIMARY KEY,
  "union_name" VARCHAR(80)
);

CREATE TABLE "add_employee" (
  "id" SERIAL PRIMARY KEY,
  "first_name" VARCHAR(80),
  "last_name" VARCHAR(80),
  "employee_number" VARCHAR(80) UNIQUE,
  "employee_status" BOOLEAN,
  "phone_number" VARCHAR(80),
  "email" VARCHAR(80),
  "address" VARCHAR(120),
  "union_id" INT,
  FOREIGN KEY ("union_id") REFERENCES "unions" ("id")
);

CREATE TABLE "jobs" (
  "job_id" SERIAL PRIMARY KEY,
  "job_number" INT,
  "job_name" VARCHAR(1000),
  "location" VARCHAR(1000),
  "start_date" DATE,
  "end_date" DATE,
  "status" VARCHAR(20) DEFAULT 'active',
  "rain_day" BOOLEAN DEFAULT false
);

CREATE TABLE "schedule" (
  "schedule_id" SERIAL PRIMARY KEY,
  "date" DATE NOT NULL,
  "job_id" INT,
  "employee_id" INT NOT NULL,
  "current_location" VARCHAR(50) DEFAULT 'union',
  "is_highlighted" BOOLEAN DEFAULT false,
  "employee_display_order" INTEGER,
  "project_display_order" INTEGER,
  FOREIGN KEY ("job_id") REFERENCES "jobs" ("job_id"),
  FOREIGN KEY ("employee_id") REFERENCES "add_employee" ("id"),
  UNIQUE ("date", "employee_id")
);

-- Insert initial union data
INSERT INTO unions (id, union_name) VALUES
(21, '21 - Bricklayers'),
(22, '22 - Cement Masons/Finishers'),
(23, '23 - Laborers'),
(24, '24 - Operators'),
(25, '25 - Carpenters');



INSERT INTO unions (id, union_name) VALUES
  (26, '26 - Supervisors'),
  (27, '27 - Trucking'),
  (28, '28 - Shop'),
  (29, '29 - Non-Union');