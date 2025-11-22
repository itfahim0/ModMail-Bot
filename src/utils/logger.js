import chalk from 'chalk';
export const log = (msg) => console.log(chalk.blue(msg));
export const error = (msg) => console.error(chalk.red(msg));