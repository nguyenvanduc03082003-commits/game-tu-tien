export interface Component {
  // Marker interface cho các Component dữ liệu thuần túy
}

export type ComponentConstructor<T extends Component = Component> = new (...args: any[]) => T;
