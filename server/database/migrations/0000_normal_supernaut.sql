CREATE TABLE "jwt_denylists" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"created_at" timestamp(6) NOT NULL,
	"exp" timestamp(6),
	"jti" varchar NOT NULL,
	"updated_at" timestamp(6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_days" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"payroll_week_id" bigint NOT NULL,
	"day_key" varchar NOT NULL,
	"date" date NOT NULL,
	"entry_hour" varchar,
	"entry_minute" varchar,
	"exit_hour" varchar,
	"exit_minute" varchar,
	"hours_worked" numeric(5, 2) DEFAULT '0.0',
	"regular_hours" numeric(5, 2) DEFAULT '0.0',
	"overtime_hours" numeric(5, 2) DEFAULT '0.0',
	"extra_hours" numeric(5, 2) DEFAULT '0.0',
	"daily_pay" numeric(10, 2) DEFAULT '0.0',
	"is_working" boolean DEFAULT false,
	"created_at" timestamp(6) NOT NULL,
	"updated_at" timestamp(6) NOT NULL,
	"force_overtime" boolean DEFAULT false NOT NULL,
	"break_hours" numeric(5, 2)
);
--> statement-breakpoint
CREATE TABLE "payroll_employees" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"user_id" bigint,
	"base_hourly_rate" numeric(10, 2) DEFAULT '0.0' NOT NULL,
	"currency" varchar DEFAULT 'MXN' NOT NULL,
	"uses_overtime" boolean DEFAULT true NOT NULL,
	"uses_tips" boolean DEFAULT false NOT NULL,
	"overtime_tier1_rate" numeric(5, 2) DEFAULT '1.5',
	"overtime_tier2_rate" numeric(5, 2) DEFAULT '2.0',
	"overtime_tier1_hours" integer DEFAULT 2,
	"hours_per_shift" integer DEFAULT 8,
	"break_hours" integer DEFAULT 1,
	"min_hours_for_break" integer DEFAULT 5,
	"created_at" timestamp(6) NOT NULL,
	"updated_at" timestamp(6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_weeks" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"payroll_employee_id" bigint NOT NULL,
	"week_id" varchar NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"weekly_tips" numeric(10, 2) DEFAULT '0.0',
	"total_hours" numeric(10, 2) DEFAULT '0.0',
	"total_regular_hours" numeric(10, 2) DEFAULT '0.0',
	"total_overtime_hours" numeric(10, 2) DEFAULT '0.0',
	"total_extra_hours" numeric(10, 2) DEFAULT '0.0',
	"total_base_pay" numeric(10, 2) DEFAULT '0.0',
	"total_pay" numeric(10, 2) DEFAULT '0.0',
	"total_shifts" integer DEFAULT 0,
	"created_at" timestamp(6) NOT NULL,
	"updated_at" timestamp(6) NOT NULL,
	"shift_rate" numeric
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit" varchar(50) NOT NULL,
	"notes" text,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "recipe_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"description" text NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"base_yield" numeric(10, 2) NOT NULL,
	"yield_unit" varchar(50) NOT NULL,
	"category" varchar(50) NOT NULL,
	"storage_instructions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"created_at" timestamp(6) NOT NULL,
	"email" varchar DEFAULT '' NOT NULL,
	"encrypted_password" varchar DEFAULT '' NOT NULL,
	"name" varchar NOT NULL,
	"remember_created_at" timestamp(6),
	"reset_password_sent_at" timestamp(6),
	"reset_password_token" varchar,
	"role" varchar DEFAULT 'admin',
	"updated_at" timestamp(6) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payroll_days" ADD CONSTRAINT "fk_rails_0b38773218" FOREIGN KEY ("payroll_week_id") REFERENCES "public"."payroll_weeks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_employees" ADD CONSTRAINT "fk_rails_d7c1f49d55" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_weeks" ADD CONSTRAINT "fk_rails_24ac287813" FOREIGN KEY ("payroll_employee_id") REFERENCES "public"."payroll_employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "index_jwt_denylists_on_jti" ON "jwt_denylists" USING btree ("jti" text_ops);--> statement-breakpoint
CREATE INDEX "index_payroll_days_on_date" ON "payroll_days" USING btree ("date" date_ops);--> statement-breakpoint
CREATE INDEX "index_payroll_days_on_payroll_week_id" ON "payroll_days" USING btree ("payroll_week_id" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "index_payroll_days_on_payroll_week_id_and_day_key" ON "payroll_days" USING btree ("payroll_week_id" text_ops,"day_key" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "index_payroll_employees_on_employee_id" ON "payroll_employees" USING btree ("employee_id" text_ops);--> statement-breakpoint
CREATE INDEX "index_payroll_employees_on_name" ON "payroll_employees" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX "index_payroll_employees_on_user_id" ON "payroll_employees" USING btree ("user_id" int8_ops);--> statement-breakpoint
CREATE INDEX "index_payroll_weeks_on_payroll_employee_id" ON "payroll_weeks" USING btree ("payroll_employee_id" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "index_payroll_weeks_on_payroll_employee_id_and_week_id" ON "payroll_weeks" USING btree ("payroll_employee_id" int8_ops,"week_id" int8_ops);--> statement-breakpoint
CREATE INDEX "index_payroll_weeks_on_start_date" ON "payroll_weeks" USING btree ("start_date" date_ops);--> statement-breakpoint
CREATE INDEX "index_payroll_weeks_on_week_id" ON "payroll_weeks" USING btree ("week_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "index_users_on_email" ON "users" USING btree ("email" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "index_users_on_reset_password_token" ON "users" USING btree ("reset_password_token" text_ops);