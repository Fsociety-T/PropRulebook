/* Assemble the rulebook after the firm files have loaded. */

RB.firms.forEach((firm) => {
  firm.models.forEach((model) => {
    model.firmId = firm.id;
    model.firmName = firm.name;
    model.firmShort = firm.short;
    model.firmColor = firm.color;
    model.key = `${firm.id}/${model.id}`;
  });
});

window.RULEBOOK = RB;
