module.exports = {
  async up(q,S) {
    await q.createTable('email_outbox', {
      id:{type:S.UUID,primaryKey:true}, recipient:{type:S.STRING(255),allowNull:false},
      subject:{type:S.STRING(255),allowNull:false},body:{type:S.TEXT,allowNull:false},
      status:{type:S.STRING(20),allowNull:false,defaultValue:'pending'},
      attempts:{type:S.INTEGER,allowNull:false,defaultValue:0},
      next_attempt_at:{type:S.DATE,allowNull:false},sent_at:{type:S.DATE},
      created_at:{type:S.DATE,allowNull:false},updated_at:{type:S.DATE,allowNull:false},
    });
    await q.addIndex('email_outbox',['status','next_attempt_at']);
  },
  async down(q) { await q.dropTable('email_outbox'); },
};
