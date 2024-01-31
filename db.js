const { Sequelize, DataTypes } = require("sequelize");

// 从环境变量中读取数据库配置
const { MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_ADDRESS = "" } = process.env;

const [host, port] = MYSQL_ADDRESS.split(":");

const sequelize = new Sequelize("nodejs_demo", MYSQL_USERNAME, MYSQL_PASSWORD, {
  host,
  port,
  dialect: "mysql" /* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */,
});

// 定义数据模型
const Namer = sequelize.define("Namer", {
  name: {
    type: DataTypes.VARCHAR,
    allowNull: false,
    defaultValue: 1,
  },
});

// 数据库初始化方法
async function init() {
  await Namer.sync({ alter: true });
}

// 导出初始化方法和模型
module.exports = {
  init,
  Namer,
};
