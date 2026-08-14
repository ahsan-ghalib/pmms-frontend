import * as React from "react";
import { CheckIcon, ChevronsUpDown, Phone } from "lucide-react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";


const DynamicPhoneInput = React.forwardRef(({
    className,
    onChange,
    value,
    error,
    label,
    required,
    disabled,
    placeholder = "Enter phone number",
    defaultCountry = "SA",
    ...props
}, ref) => {
    const [isValid, setIsValid] = React.useState(true);
    const [formattedValue, setFormattedValue] = React.useState("");


    const handleValueChange = (newValue) => {
        setFormattedValue(newValue || "");


        const isValidPhone = newValue ? RPNInput.isValidPhoneNumber(newValue) : false;
        setIsValid(isValidPhone || !newValue);


        onChange?.(newValue || "");
    };


    const getCountryFromValue = (phoneValue) => {
        if (!phoneValue) return defaultCountry;
        try {
            return RPNInput.getCountryCallingCode && phoneValue
                ? RPNInput.parsePhoneNumber(phoneValue)?.country || defaultCountry
                : defaultCountry;
        } catch {
            return defaultCountry;
        }
    };

    return (
        <div className={cn("mb-4", className)}>
            {label && (
                <Label className={cn("text-sm font-medium mb-1", error && "text-destructive")}>
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </Label>
            )}

            <div className="relative">
                <RPNInput.default
                    ref={ref}
                    className={cn(
                        "flex w-full",
                        error && "border-destructive focus-within:ring-destructive",
                        !isValid && value && "border-orange-500 focus-within:ring-orange-500"
                    )}
                    flagComponent={FlagComponent}
                    countrySelectComponent={CountrySelect}
                    inputComponent={InputComponent}
                    smartCaret={true}
                    value={value || undefined}
                    onChange={handleValueChange}
                    defaultCountry={defaultCountry}
                    placeholder={placeholder}
                    disabled={disabled}
                    international={false}
                    withCountryCallingCode={true}
                    {...props}
                />

                {/* Phone icon indicator */}
                <Phone className={cn(
                    "absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none",
                    disabled && "opacity-50"
                )} />
            </div>

            {/* Validation feedback */}
            {error && (
                <p className="text-sm text-destructive flex items-center gap-1">
                    {error}
                </p>
            )}

            {!isValid && value && !error && (
                <p className="text-sm text-orange-600 flex items-center gap-1">
                    Please enter a valid phone number
                </p>
            )}


        </div>
    );
});
DynamicPhoneInput.displayName = "DynamicPhoneInput";

// Enhanced Input Component with better styling
const InputComponent = React.forwardRef(({ className, ...props }, ref) => (
    <Input
        className={cn(
            "rounded-e-lg rounded-s-none border-l-0 pr-10",
            "focus:border-l focus:border-l-input",
            className
        )}
        {...props}
        ref={ref}
    />
));
InputComponent.displayName = "InputComponent";

// Enhanced Country Select with search and favorites
const CountrySelect = ({ disabled, value: selectedCountry, options: countryList, onChange }) => {
    const [searchValue, setSearchValue] = React.useState("");
    const [isOpen, setIsOpen] = React.useState(false);

    // Popular countries that appear at the top
    const popularCountries = ['SA', 'PK', 'US', 'GB', 'IN', 'CA', 'AE', 'QA', 'KW'];

    // Filter and sort countries
    const filteredCountries = React.useMemo(() => {
        const filtered = countryList.filter(country =>
            country.label?.toLowerCase().includes(searchValue.toLowerCase()) ||
            country.value?.toLowerCase().includes(searchValue.toLowerCase())
        );

        if (!searchValue) {
            // Show popular countries first, then the rest
            const popular = filtered.filter(country =>
                popularCountries.includes(country.value)
            );
            const others = filtered.filter(country =>
                !popularCountries.includes(country.value)
            );

            return [
                ...popular.sort((a, b) =>
                    popularCountries.indexOf(a.value) - popularCountries.indexOf(b.value)
                ),
                ...others.sort((a, b) => a.label.localeCompare(b.label))
            ];
        }

        return filtered.sort((a, b) => a.label.localeCompare(b.label));
    }, [countryList, searchValue]);

    const selectedCountryInfo = countryList.find(c => c.value === selectedCountry);

    return (
        <Popover
            open={isOpen}
            modal
            onOpenChange={(open) => {
                setIsOpen(open);
                if (open) setSearchValue("");
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        "flex gap-2 rounded-e-none rounded-s-lg border-r-0 px-3 min-w-[80px]",
                        "hover:bg-muted/50 focus:z-10 focus:ring-2 focus:ring-ring",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={disabled}
                >
                    <FlagComponent
                        country={selectedCountry}
                        countryName={selectedCountryInfo?.label}
                    />
                    {!disabled && (
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
                <Command>
                    <CommandInput
                        value={searchValue}
                        onValueChange={(value) => {
                            setSearchValue(value);
                            // Scroll to top when searching
                            setTimeout(() => {
                                const commandList = document.querySelector('[cmdk-list]');
                                if (commandList) {
                                    commandList.scrollTop = 0;
                                }
                            }, 0);
                        }}
                        placeholder="Search countries..."
                        className="border-0 focus:ring-0"
                    />
                    <CommandList className="max-h-72 overflow-y-auto">
                        <CommandEmpty>No country found.</CommandEmpty>

                        {!searchValue && (
                            <CommandGroup heading="Popular">
                                {filteredCountries
                                    .filter(country => popularCountries.includes(country.value))
                                    .map(({ value, label }) =>
                                        value ? (
                                            <CountrySelectOption
                                                key={`popular-${value}`}
                                                country={value}
                                                countryName={label}
                                                selectedCountry={selectedCountry}
                                                onChange={onChange}
                                                onSelectComplete={() => setIsOpen(false)}
                                            />
                                        ) : null
                                    )}
                            </CommandGroup>
                        )}

                        <CommandGroup heading={searchValue ? "Results" : "All Countries"}>
                            {filteredCountries
                                .filter(country => searchValue || !popularCountries.includes(country.value))
                                .map(({ value, label }) =>
                                    value ? (
                                        <CountrySelectOption
                                            key={value}
                                            country={value}
                                            countryName={label}
                                            selectedCountry={selectedCountry}
                                            onChange={onChange}
                                            onSelectComplete={() => setIsOpen(false)}
                                        />
                                    ) : null
                                )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

// Enhanced Country Option with better styling
const CountrySelectOption = ({
    country,
    countryName,
    selectedCountry,
    onChange,
    onSelectComplete,
}) => {
    const isSelected = country === selectedCountry;
    const callingCode = RPNInput.getCountryCallingCode(country);

    const handleSelect = () => {
        onChange(country);
        onSelectComplete();
    };

    return (
        <CommandItem
            className={cn(
                "flex items-center gap-3 px-3 py-2 cursor-pointer",
                "hover:bg-muted/50 aria-selected:bg-muted",
                isSelected && "bg-muted"
            )}
            onSelect={handleSelect}
        >
            <FlagComponent country={country} countryName={countryName} />
            <span className="flex-1 text-sm font-medium truncate">{countryName}</span>
            <span className="text-xs text-muted-foreground font-mono">+{callingCode}</span>
            <CheckIcon
                className={cn(
                    "h-4 w-4 text-primary",
                    isSelected ? "opacity-100" : "opacity-0"
                )}
            />
        </CommandItem>
    );
};

// Enhanced Flag Component with fallback
const FlagComponent = ({ country, countryName }) => {
    const Flag = flags[country];

    return (
        <span className={cn(
            "flex h-4 w-6 overflow-hidden rounded-sm bg-muted border border-border",
            "items-center justify-center text-xs font-medium"
        )}>
            {Flag ? (
                <Flag title={countryName} className="w-full h-full object-cover" />
            ) : (
                <span className="text-[10px] font-bold text-muted-foreground">
                    {country}
                </span>
            )}
        </span>
    );
};

// Hook for phone number validation and formatting
const usePhoneValidation = (value) => {
    return React.useMemo(() => {
        if (!value) return { isValid: true, formatted: "", country: null };

        try {
            const phoneNumber = RPNInput.parsePhoneNumber(value);
            return {
                isValid: RPNInput.isValidPhoneNumber(value),
                formatted: RPNInput.formatPhoneNumber(value),
                country: phoneNumber?.country,
                nationalNumber: phoneNumber?.nationalNumber,
                countryCallingCode: phoneNumber?.countryCallingCode
            };
        } catch {
            return { isValid: false, formatted: value, country: null };
        }
    }, [value]);
};

export {
    DynamicPhoneInput as PhoneInput,
    DynamicPhoneInput as PhoneField,
    usePhoneValidation
};