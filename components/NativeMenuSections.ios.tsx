import { useState } from "react";
import { Host, List, Section, Label } from "@expo/ui/swift-ui";
import {
    listStyle,
    scrollDisabled,
    scrollContentBackground,
    onTapGesture,
    onGeometryChange,
    headerProminence,
    tint,
} from "@expo/ui/swift-ui/modifiers";
import type { SFSymbols7_0 } from "sf-symbols-typescript";

interface NativeMenuItem {
    title: string;
    systemImage: SFSymbols7_0;
    tintColor?: string;
    onPress: () => void;
}

export interface NativeMenuSectionData {
    title: string;
    items: NativeMenuItem[];
}

interface Props {
    sections: NativeMenuSectionData[];
    children?: React.ReactNode;
}

export default function NativeMenuSections({ sections }: Props) {
    const totalItems = sections.reduce(
        (sum: number, s: NativeMenuSectionData) => sum + s.items.length,
        0,
    );
    const [height, setHeight] = useState(totalItems * 58 + sections.length * 60 + 40);

    return (
        <Host style={{ height, marginHorizontal: 16 }}>
            <List
                modifiers={[
                    listStyle("insetGrouped"),
                    scrollDisabled(true),
                    scrollContentBackground("hidden"),
                    headerProminence("increased"),
                    onGeometryChange(({ height: h }) => {
                        if (h > 0 && Math.abs(h - height) > 2) {
                            setHeight(h);
                        }
                    }),
                ]}
            >
                {sections.map((section) => (
                    <Section key={section.title} title={section.title}>
                        {section.items.map((item) => (
                            <Label
                                key={item.title}
                                title={item.title}
                                systemImage={item.systemImage}
                                modifiers={[
                                    onTapGesture(item.onPress),
                                    ...(item.tintColor ? [tint(item.tintColor)] : []),
                                ]}
                            />
                        ))}
                    </Section>
                ))}
            </List>
        </Host>
    );
}
