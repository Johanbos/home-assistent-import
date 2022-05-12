
class Statistics {
    constructor() {
       this.data = [];
       this.lastStatistic = null;
    }

    add(metadata_id, date, value) {
        try {
            var sum = 0; 
            if (this.lastStatistic) {
                if (this.lastStatistic.state > value) {
                    throw { message: 'Added value cannot be smaller then previous value', previousValue: this.lastStatistic.state, value }
                }

                if (this.lastStatistic.start > date) {
                    throw { message: 'Added date cannot be before previous date', previousDate: this.lastStatistic.start, date }
                }

                sum = this.lastStatistic.sum + (value - this.lastStatistic.state);
            }

            const statistic = new Statistic(metadata_id, date, date, value, sum);
            this.data.push(statistic);
            this.lastStatistic = statistic;
        } catch (error) {
            // ignore this statistic
            console.error(error);
        }
    }
  
    getScript(existingDataMode) {
        try {
            if (!this.lastStatistic) {
                throw 'no data available'
            }
                    
            const metadata_id = this.lastStatistic.metadata_id;
            const start = this.lastStatistic.start;
            let sql = '';
            if (existingDataMode == 'update') {
                const deleteSql1 = `delete from statistics where metadata_id = ${metadata_id} and start <= "${start}"\n\n`;
                const deleteSql2 = `delete from statistics_short_term where metadata_id = ${metadata_id} and start <= "${start}"\n\n`;
                const updateSql1 = `update statistics set sum = sum + ${this.lastStatistic.sum} where metadata_id = ${metadata_id} and start > "${start}"\n\n`;
                const updateSql2 = `update statistics_short_term set sum = sum + ${this.lastStatistic.sum} where metadata_id = ${metadata_id} and start > "${start}"\n\n`;
                sql = sql + deleteSql1 + deleteSql2 + updateSql1 + updateSql2;
            }
            
            if (existingDataMode == 'delete') {
                const deleteSql1 = `delete from statistics where metadata_id = ${metadata_id}\n\n`;
                const deleteSql2 = `delete from statistics_short_term where metadata_id = ${metadata_id}\n\n`;
                sql = sql + deleteSql1 + deleteSql2;
            }

            const insertSql = 'insert into statistics (created, start, state, sum, metadata_id) values\n';
            var resultSql = [];
            this.data.forEach(element => {
                resultSql.push(`("${element.created}", "${element.start}", ${element.state}, ${element.sum}, ${element.metadata_id})`);
            });
            return sql + insertSql + resultSql.join(',\n');
        } catch (error) {
            return '-- error: ' + error;
        }
    }
}

class Statistic {
    constructor(metadata_id, created, start, state, sum) {
        this.metadata_id = metadata_id;
        this.created = created;
        this.start = start;
        this.state = state;
        this.sum = sum;
    }
}

module.exports = Statistics;