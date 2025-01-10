export const VariablesAddButton = (props: {
  labelName: string;
  clickFunc: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={() => props.clickFunc()}
      className="option-button"
    >
      {props.labelName}
    </button>
  );
};
