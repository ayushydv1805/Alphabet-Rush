function AnswerField({ name, label, placeholder, value, onChange, disabled }) {
  return (
    <div className="answer-field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type="text"
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoComplete="off"
        spellCheck="false"
      />
    </div>
  );
}

export default AnswerField;
