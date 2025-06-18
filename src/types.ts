// types.ts

export interface Component<DataType = any> {
  id: string;
  type: string;
  data: DataType;
}

export interface Tab {
  key: string;
  components: Component[];
}

export interface State {
  tabs: Tab[];
  activeTabKey: string;
}
